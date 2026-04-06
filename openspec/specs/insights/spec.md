# M4 洞察管理 (Insight) — 基线规格

> 最后更新: 2026-04-05

## 状态: 未实现

洞察（Insight）是证据与决策之间的中间层。AI 在对抗推理过程中自动生成洞察，用户也可手动创建。每条洞察关联到一个议题，并通过 `InsightEvidence` 关联表链接支撑证据。洞察经确认后可参与对抗推理流程，最终影响决策卡的生成。

当前状态：类型定义 (`shared/src/types/insight.ts`)、数据库表结构 (`insights`, `insight_evidence`) 已完成。前端仅有 `InsightListPage` stub 页面，后端无业务逻辑。

---

## 模块定位

```
Evidence(M2) ──(关联)──▶ IssueEvidence(M3) ──(提炼)──▶ Insight(M4) ──(输入)──▶ Reasoning(M5)
                                                          ▲
                                                          │
                                                   Signal(M9) ──(转化)──▶ Insight
```

- **上游**：证据管理 (M2) + 立场分析 (M3) 提供原始素材；信号检测 (M9) 可将信号转化为洞察
- **下游**：对抗推理引擎 (M5) 消费洞察作为推理输入
- **生成方式**：`ai_reasoning`（推理引擎自动生成）、`ai_signal`（信号转化）、`manual`（用户手动创建）

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 洞察 CRUD | 手动创建/查看/编辑/删除洞察 | ❌ 未实现 |
| F2 | 洞察列表 | 按 `status`, `type`, `source` 筛选 + 分页 | ❌ 未实现 |
| F3 | 确认洞察 | 将 `draft` 状态洞察标记为 `confirmed` | ❌ 未实现 |
| F4 | 争议洞察 | 将洞察标记为 `disputed`，需提供原因 | ❌ 未实现 |
| F5 | 证据关联 | 通过 `InsightEvidence` 关联证据，支持 3 种关联类型 | ❌ 未实现 |
| F6 | 洞察合并 | 合并多个同议题洞察为一条新洞察 | ❌ 未实现 |
| F7 | AI 自动生成 | 基于议题关联证据自动提炼洞察（可控制最大数量和来源筛选） | ❌ 未实现 |
| F8 | 洞察归档 | 将过时洞察标记为 `archived` | ❌ 未实现 |

### 业务规则

1. 洞察必须归属于一个议题 (`issueId` 必填)
2. 手动创建洞察时 `source` 设为 `manual`，`status` 初始化为 `draft`
3. AI 生成洞察时 `source` 设为 `ai_reasoning` 或 `ai_signal`，`createdBy` 设为 `system`
4. 确认操作记录 `confirmedBy` + `confirmedAt`；争议操作记录 `disputedBy` + `disputedAt` + `disputeReason`
5. 合并洞察仅允许同议题内合并，合并后源洞察标记为 `archived`
6. `confidence` 范围 0-100，`score` 由系统自动评分
7. `direction` 标识洞察对议题的倾向：`pro`（支持）/ `con`（反对）/ `neutral`（中立）

---

## 数据模型

### `insights` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `issue_id` | string | 所属议题 ID (FK → issues) |
| `title` | string | 洞察标题 |
| `description` | string | 洞察描述 |
| `type` | enum | 洞察类型: `finding` / `risk` / `opportunity` / `contradiction` |
| `status` | enum | 状态: `draft` / `confirmed` / `disputed` / `archived` |
| `source` | enum | 来源: `ai_reasoning` / `ai_signal` / `manual` |
| `direction` | enum | 方向: `pro` / `con` / `neutral` |
| `confidence` | number | 置信度 (0-100) |
| `score` | number | 系统评分 |
| `reasoning_run_id` | string? | 关联的推理运行 ID（AI 生成时） |
| `created_by` | string | 创建者 ID |
| `confirmed_by` | string? | 确认者 ID |
| `confirmed_at` | datetime? | 确认时间 |
| `disputed_by` | string? | 争议者 ID |
| `disputed_at` | datetime? | 争议时间 |
| `dispute_reason` | string? | 争议原因 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

### `insight_evidence` 关联表

| 字段 | 类型 | 说明 |
|------|------|------|
| `insight_id` | string | 洞察 ID (FK → insights) |
| `evidence_id` | string | 证据 ID (FK → evidence) |
| `support_type` | enum | 关联类型: `supports` / `contradicts` / `contextual` |
| `note` | string? | 关联说明 |
| `created_at` | datetime | 创建时间 |

复合主键: `(insight_id, evidence_id)`

### TypeScript 类型定义

```typescript
// shared/src/types/insight.ts
export type InsightStatus = 'draft' | 'confirmed' | 'disputed' | 'archived'
export type InsightType = 'finding' | 'risk' | 'opportunity' | 'contradiction'
export type InsightSource = 'ai_reasoning' | 'ai_signal' | 'manual'

export interface Insight {
  id: string
  tenantId: string
  issueId: string
  title: string
  description: string
  type: InsightType
  status: InsightStatus
  source: InsightSource
  direction: 'pro' | 'con' | 'neutral'
  confidence: number
  score: number
  reasoningRunId?: string
  createdBy: string
  confirmedBy?: string
  confirmedAt?: string
  disputedBy?: string
  disputedAt?: string
  disputeReason?: string
  createdAt: string
  updatedAt: string
}

export interface InsightEvidence {
  insightId: string
  evidenceId: string
  supportType: 'supports' | 'contradicts' | 'contextual'
  note?: string
  createdAt: string
}
```

---

## 状态机

```
         ┌─────────────────────────────────────┐
         │                                     │
         ▼                                     │
       draft ──────▶ confirmed ──────▶ archived
         │                                     ▲
         │                                     │
         └──────▶ disputed ───────────────────┘
```

- `draft` → `confirmed`：用户确认洞察有效
- `draft` → `disputed`：用户对洞察提出异议
- `confirmed` → `archived`：洞察过时或被合并
- `disputed` → `archived`：争议结束，洞察归档

---

## API 接口 (规划)

### 洞察 CRUD

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/issues/:issueId/insights` | 手动创建洞察 | analyst+ |
| `GET` | `/api/issues/:issueId/insights` | 获取议题下洞察列表 | viewer+ |
| `GET` | `/api/insights/:id` | 洞察详情 | viewer+ |
| `PATCH` | `/api/insights/:id` | 更新洞察 | analyst+ |
| `DELETE` | `/api/insights/:id` | 删除洞察 | analyst+ |

### 确认与争议

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/insights/:id/confirm` | 确认洞察 | analyst+ |
| `POST` | `/api/insights/:id/dispute` | 争议洞察（需 `reason`） | analyst+ |

### 证据关联

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/insights/:id/evidence` | 关联证据（需 `evidenceId`, `supportType`） | analyst+ |
| `GET` | `/api/insights/:id/evidence` | 获取洞察关联的证据 | viewer+ |
| `DELETE` | `/api/insights/:id/evidence/:evidenceId` | 取消证据关联 | analyst+ |

### 合并与 AI 生成

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/insights/merge` | 合并洞察（需 `sourceInsightIds[]`） | analyst+ |
| `POST` | `/api/issues/:issueId/insights/generate` | AI 自动生成洞察 | analyst+ |

### 查询参数

列表接口 `GET /api/issues/:issueId/insights` 支持：
- `status`: `draft` / `confirmed` / `disputed` / `archived`
- `type`: `finding` / `risk` / `opportunity` / `contradiction`
- `source`: `ai_reasoning` / `ai_signal` / `manual`
- `page`, `pageSize`, `sortBy`, `sortOrder`

---

## 前端 (规划)

### 当前状态

- `InsightListPage` — stub 页面，使用 `any[]` 类型，无 API 调用

### 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `InsightListPage` | 洞察列表页（含筛选、搜索） | ❌ 仅 stub |
| `InsightCard` | 洞察卡片（显示类型、状态、置信度、方向） | ❌ 未实现 |
| `InsightDetailPanel` | 洞察详情面板（含关联证据列表） | ❌ 未实现 |
| `InsightCreateDialog` | 手动创建洞察对话框 | ❌ 未实现 |
| `InsightEvidenceLinker` | 证据关联管理组件 | ❌ 未实现 |
| `InsightMergeDialog` | 洞察合并对话框 | ❌ 未实现 |
| `InsightGenerateButton` | AI 生成洞察触发按钮 | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `shared/src/types/insight.ts` | TypeScript 类型定义 |
| `shared/src/validators/entities.ts` | Zod 校验 schema（待补充） |
| `database/src/migrations/001_initial.ts` | `insights` + `insight_evidence` 建表 |
| `docs/03-API设计文档.md` § 六 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M4 | 模块功能点定义 |
| `frontend/src/features/insights/` | 前端模块目录（仅 stub） |
