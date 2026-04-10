# M5 对抗推理引擎 (Adversarial Reasoning) — 基线规格

> 最后更新: 2026-04-05

## 状态: 未实现

对抗推理引擎是 ResearchOS 的核心创新模块。采用三方 Agent 架构：Advocate（正方，基于内部证据）、Critic（反方，基于外部证据）、Judge（裁判，综合裁决），通过内外证据的对抗式分析生成高质量决策建议。推理过程支持 SSE 流式输出，并在执行前进行 preflight check 以评估证据充分性。

当前状态：数据库表 `reasoning_runs` 已定义；API 设计文档已完成；无 TypeScript 类型文件（推理相关类型嵌入在决策流程中，未独立抽取）；前端无任何 stub 页面；后端无业务逻辑。

---

## 模块定位

```
IssueEvidence(M3) + Insight(M4)
         │
         ▼
  ┌──────────────────────────────────────────────┐
  │            Reasoning Engine (M5)              │
  │                                               │
  │  ① Preflight Check (证据充分性评估)           │
  │         │                                     │
  │         ▼                                     │
  │  ② Advocate Agent ← internal evidence         │
  │         │                                     │
  │         ▼                                     │
  │  ③ Critic Agent   ← external evidence         │
  │         │                                     │
  │         ▼                                     │
  │  ④ Judge Agent    ← advocate + critic output  │
  │         │                                     │
  │         ▼                                     │
  │  ⑤ Generate Insight(M4) + DecisionCard(M6)   │
  └──────────────────────────────────────────────┘
```

- **上游**：议题证据 (M3) 提供已标注立场的证据；洞察 (M4) 提供已确认洞察
- **下游**：生成新洞察 → Insight (M4)；生成决策卡 → DecisionCard (M6)
- **AI 依赖**：Claude API (`claude-sonnet-4-20250514`)

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 触发推理 | 对指定议题发起对抗推理 | ❌ 未实现 |
| F2 | Preflight Check | 评估证据充分性，返回推理等级 | ❌ 未实现 |
| F3 | Advocate Agent | 基于内部证据构建正方论据 | ❌ 未实现 |
| F4 | Critic Agent | 基于外部证据构建反方论据 + 识别风险和盲点 | ❌ 未实现 |
| F5 | Judge Agent | 综合正反双方输出做出裁决 | ❌ 未实现 |
| F6 | SSE 流式输出 | 实时推送推理过程状态和中间结果 | ❌ 未实现 |
| F7 | 推理取消 | 取消进行中的推理运行 | ❌ 未实现 |
| F8 | 推理链路追踪 | 可视化推理过程（输入→Agent→输出） | ❌ 未实现 |
| F9 | 降级策略 | 证据不平衡时自动降级推理 | ❌ 未实现 |
| F10 | 自动生成洞察 | 推理过程中自动生成 Insight | ❌ 未实现 |
| F11 | 自动生成决策卡 | 推理完成后自动生成 DecisionCard | ❌ 未实现 |

### Preflight Check（推理前检查）

推理前评估证据的充分性和平衡性，返回可执行等级：

| 等级 | 条件 | 行为 |
|------|------|------|
| `standard` | 内部证据 ≥ 3 且外部证据 ≥ 3 | 正常三方推理 |
| `degraded` | 一方证据 < 3 但 ≥ 1 | 执行推理但置信度自动降低 20% |
| `single_side` | 一方证据为 0，另一方 ≥ 1 | 仅单方推理，标注「单侧推理」 |
| `refused` | 双方证据均为 0 | 拒绝推理，提示用户补充证据 |

### 降级策略规则

1. **证据不平衡**：当内外证据比超过 3:1 时，置信度自动降低 20%
2. **单侧推理**：仅一方有证据时，生成的决策卡明确标注「基于不完整证据」
3. **拒绝推理**：双方均无证据时返回 `refused`，不执行推理
4. **最低证据要求**：至少一方有 1 条证据才可触发推理

### 三方 Agent 分工

| Agent | 输入 | 职责 | 输出 |
|-------|------|------|------|
| **Advocate** | 内部证据 (`internal`) | 构建支持论据，评估每个论据的强度 | `arguments[]` (claim, evidenceIds, strength, reasoning), `confidence`, `summary` |
| **Critic** | 外部证据 (`external`) | 构建反驳论据，识别风险和盲点 | `rebuttals[]`, `risks[]`, `blindSpots[]`, `confidence`, `summary` |
| **Judge** | Advocate + Critic 输出 | 综合裁决，生成推荐方案 | `recommendation`, `confidence`, `keyFactors[]`, `dissent`, `suggestedActions[]`, `summary` |

---

## 数据模型

### `reasoning_runs` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `issue_id` | string | 所属议题 ID (FK → issues) |
| `decision_card_id` | string? | 生成的决策卡 ID |
| `input_snapshot` | JSON | 输入快照: `{ internalEvidenceIds[], externalEvidenceIds[], insightIds[] }` |
| `advocate_output` | JSON? | 正方输出 (AdvocateOutput) |
| `critic_output` | JSON? | 反方输出 (CriticOutput) |
| `judge_output` | JSON? | 裁判输出 (JudgeOutput) |
| `model_id` | string? | AI 模型标识 |
| `prompt_version` | string? | 提示词版本 |
| `token_usage` | JSON? | Token 用量: `{ input, output, total, estimatedCost }` |
| `latency_ms` | number? | 推理耗时 (毫秒) |
| `status` | enum | 推理状态 (9 种) |
| `error_message` | string? | 错误信息 |
| `created_at` | datetime | 创建时间 |
| `completed_at` | datetime? | 完成时间 |

### 推理输出结构（JSON 字段）

```typescript
// AdvocateOutput — 正方 Agent 输出
interface AdvocateOutput {
  arguments: Array<{
    claim: string
    evidenceIds: string[]
    strength: number          // 论据强度 0-100
    reasoning: string
  }>
  confidence: number
  summary: string
}

// CriticOutput — 反方 Agent 输出
interface CriticOutput {
  rebuttals: Array<{
    claim: string
    evidenceIds: string[]
    strength: number
    reasoning: string
  }>
  risks: Array<{
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    likelihood: number        // 可能性 0-100
    evidenceIds: string[]
  }>
  blindSpots: string[]
  confidence: number
  summary: string
}

// JudgeOutput — 裁判 Agent 输出
interface JudgeOutput {
  recommendation: string
  confidence: number
  keyFactors: string[]
  dissent: string
  suggestedActions: string[]
  summary: string
}
```

---

## 状态机

```
pending → preparing → advocate_running → critic_running → judge_running → generating_card → completed
    │         │              │                │               │                │
    │         │              │                │               │                │
    └─────────┴──────────────┴────────────────┴───────────────┴────────────────┴──▶ failed
    │
    └──▶ cancelled (任意运行中状态均可取消)
```

9 种状态：

| 状态 | 说明 |
|------|------|
| `pending` | 已创建，等待处理 |
| `preparing` | 准备中（收集证据快照） |
| `advocate_running` | 正方 Agent 运行中 |
| `critic_running` | 反方 Agent 运行中 |
| `judge_running` | 裁判 Agent 运行中 |
| `generating_card` | 生成决策卡中 |
| `completed` | 推理完成 |
| `failed` | 推理失败 |
| `cancelled` | 用户取消 |

---

## SSE 流式事件

推理过程通过 Server-Sent Events 实时推送 6 种事件：

| 事件类型 | 数据结构 | 说明 |
|----------|----------|------|
| `status_change` | `{ type, status, message }` | 推理阶段变化 |
| `progress` | `{ type, agent, partial }` | Agent 中间输出 |
| `agent_complete` | `{ type, agent, summary }` | 单个 Agent 完成 |
| `insight_generated` | `{ type, insightId, title }` | 生成了新洞察 |
| `completed` | `{ type, runId, decisionCardId }` | 推理完成 |
| `error` | `{ type, message }` | 推理失败 |

---

## Runtime Backbone 集成

### 统一运行骨架

1. 对抗推理执行 MUST 创建一个 `reasoning` 类型的 runtime run，并在不替代 `reasoning_runs` 业务语义的前提下提供统一运行视图
2. runtime run MUST 记录 `tenant_id`、`issue_id`、`status`、`input_snapshot`、`output_snapshot`
3. 涉及模型调用的对抗推理运行 SHOULD 记录 `model`、`token_usage`、`latency_ms`、`estimated_cost`

### 任务拆分

1. 对抗推理执行 MUST 支持映射为可追踪的 runtime tasks
2. 首批 task 划分 SHOULD 至少覆盖：`prepare_reasoning_context`、`run_preflight`、`run_advocate`、`run_critic`、`extract_reasoning_insights`、`run_judge`、`generate_decision_card`
3. runtime task MUST 支持读取已完成/未完成步骤，以支持失败后 resume

### Snapshot 与 Artifact

1. reasoning runtime MUST 固化输入 snapshot，至少包含 `issue`、`internalEvidenceIds`、`externalEvidenceIds`、`insightIds`、`preflightLevel`、`promptVersion`、`modelPolicy`
2. Advocate / Critic / Judge 全量输出 SHOULD 作为 runtime artifacts 登记
3. DecisionCard 输出 SHOULD 以 artifact 引用形式登记，即使主业务结果仍保留在 `decision_cards` 或 `reasoning_runs` 中

### 事件与恢复

1. reasoning SSE 事件 MUST 可映射到统一 runtime event shape
2. runtime event 至少 MUST 支持 `status_change`、`progress`、`agent_complete`、`insight_generated`、`completed`、`error`
3. failed reasoning run SHOULD 支持 task-level resume，并在恢复时跳过已完成 task
4. 已完成 task 产生的 artifacts MUST 在失败或恢复时保留，不能因重试被隐式丢弃

---

## API 接口 (规划)

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/issues/:id/reasoning` | 触发对抗推理 | analyst+ |
| `GET` | `/api/issues/:id/reasoning` | 获取推理运行列表 | viewer+ |
| `GET` | `/api/issues/:id/reasoning/:runId` | 查询推理运行详情/状态 | viewer+ |
| `POST` | `/api/issues/:id/reasoning/:runId/cancel` | 取消推理 | analyst+ |
| `GET` | `/api/issues/:id/reasoning/:runId/stream` | SSE 流式输出推理过程 | viewer+ |
| `GET` | `/api/issues/:id/reasoning/:runId/trace` | 推理链路追踪 | viewer+ |
| `GET` | `/api/issues/:id/reasoning/preflight` | Preflight Check（评估证据充分性） | analyst+ |

### 触发推理请求体

```typescript
{
  regenerateDecisionCard?: boolean   // 默认 true，是否生成/更新决策卡
}
```

### Preflight 响应体

```typescript
{
  level: 'standard' | 'degraded' | 'single_side' | 'refused'
  internalEvidenceCount: number
  externalEvidenceCount: number
  insightCount: number
  message: string
}
```

---

## 前端 (规划)

### 当前状态

- 无任何前端页面或组件

### 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `ReasoningTriggerButton` | 触发推理按钮（含 preflight 检查提示） | ❌ 未实现 |
| `ReasoningProgressPanel` | 推理进度面板（消费 SSE 事件） | ❌ 未实现 |
| `ReasoningResultView` | 推理结果展示（正方/反方/裁判三栏） | ❌ 未实现 |
| `ReasoningTraceVisualization` | 推理链路可视化 | ❌ 未实现 |
| `PreflightCheckDialog` | 证据充分性检查对话框 | ❌ 未实现 |
| `ReasoningHistoryList` | 推理运行历史列表 | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `database/src/migrations/001_initial.ts` | `reasoning_runs` 建表 |
| `docs/02-数据模型设计.md` § 4.7 | 数据模型定义 |
| `docs/03-API设计文档.md` § 七 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M5 | 模块功能点定义 |
| `backend/src/modules/ai/` | AI/LLM 基础设施（Claude 客户端、提示词引擎已实现） |

> **注意**：推理相关 TypeScript 类型未独立为文件，实施时需新增 `shared/src/types/reasoning.ts` 或嵌入到决策流程类型中。
