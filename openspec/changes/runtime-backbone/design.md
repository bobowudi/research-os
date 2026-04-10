## Context

Phase 1 与 Phase 2 已定义并推进了 ResearchOS 的核心业务闭环：

- `phase1-core-engine`: Evidence / Data Source / Embedding / Adversarial Reasoning / Decision
- `phase2-loop-completion`: Insight / Stance / Action / Review / Summary loop

当前系统已具备多个“运行链”的雏形，但这些运行链的执行语义分散在业务模块中：

- `reasoning_runs` 承载对抗推理状态机与 SSE
- `import_jobs` 承载采集同步状态
- `reviews.generated_evidence_id` 承载回看闭环完成状态
- Worker 直接承担“执行 + 编排 + 记录”多重职责
- 中间产物大多混在业务字段或局部逻辑里

本设计的目标不是重做业务模块，而是在其之上建立统一 Runtime Backbone，把这些已有链路提升为共享的 Run / Task / Artifact / Snapshot 执行模型。

## Goals / Non-Goals

**Goals**
- 定义统一 Runtime 目录与核心抽象
- 建立共享的 Run / Task / Artifact / Snapshot 模型
- 为 Reasoning / Import / Review Summary 三条链路提供统一编排骨架
- 统一事件协议、恢复语义、成本/时延/审计字段
- 保持与现有业务表和 specs 的兼容关系

**Non-Goals**
- 不重写现有 reasoning / import / review 业务逻辑
- 不把 stance / insight / actions 全部提升为一级 orchestrator
- 不在本次设计中引入复杂 DAG 调度器
- 不设计跨租户共享记忆
- 不实现完整前端 runtime dashboard

## Decisions

### 1. Runtime 目录分层

新增统一运行时目录：

```txt
backend/src/runtime/
  core/
  orchestrators/
  tasks/
  artifacts/
  context/
  events/
  recovery/
  governance/
  policies/
```

职责划分：

- `core/`: Run、Task、状态枚举、执行器接口
- `orchestrators/`: 按业务运行链组织编排器
- `tasks/`: 最小执行步骤定义与任务执行封装
- `artifacts/`: 中间产物登记、引用、读回
- `context/`: 运行输入快照与上下文构建
- `events/`: 统一事件类型与事件发射
- `recovery/`: retry / resume / failure classification
- `governance/`: tenant、permission、audit、cost、policy
- `policies/`: model policy、retry policy、artifact retention policy

**设计理由：**
- 将“执行骨架”从模块 service 中抽离出来
- 保留现有业务模块边界，不强行重构成单一大模块
- 方便后续按链路逐步接入，而不是一次性大改

### 2. Core 抽象

#### 2.1 BaseRun

```ts
export interface BaseRun {
  id: string
  tenantId: string
  issueId?: string
  type:
    | 'import'
    | 'stance_analysis'
    | 'insight_generation'
    | 'reasoning'
    | 'decision_action_generation'
    | 'review_summary'
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'
  triggeredBy?: string
  inputSnapshot?: unknown
  outputSnapshot?: unknown
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  latencyMs?: number
  tokenUsage?: {
    input: number
    output: number
    total: number
    estimatedCost?: number
  }
}
```

**设计理由：**
- `type` 统一不同业务运行
- `inputSnapshot` 固化运行启动时的输入环境
- `outputSnapshot` 保留可供列表和审计使用的摘要
- `tokenUsage` 与 `latencyMs` 作为治理字段内建，而不是外挂统计

#### 2.2 RuntimeTask

```ts
export interface RuntimeTask {
  id: string
  runId: string
  tenantId: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  dependsOn: string[]
  workerName?: string
  input?: unknown
  output?: unknown
  errorMessage?: string
  startedAt?: string
  completedAt?: string
}
```

**设计理由：**
- 一个 Run 可拆成多个 Task
- `dependsOn` 为后续 DAG 扩展预留，但当前阶段只做简单串行 / 局部并行
- `workerName` 便于调试与失败定位
- task-level 状态是 resume / retry 的基础

#### 2.3 ArtifactRef

```ts
export interface ArtifactRef {
  id: string
  tenantId: string
  runId?: string
  issueId?: string
  type:
    | 'raw_source'
    | 'evidence_summary'
    | 'embedding_vector'
    | 'stance_result'
    | 'insight_result'
    | 'advocate_output'
    | 'critic_output'
    | 'judge_output'
    | 'decision_card'
    | 'review_summary'
    | 'historical_evidence'
  entityType?: string
  entityId?: string
  storageType: 'db' | 's3' | 'es'
  storageKey: string
  summary?: string
  metadata?: Record<string, unknown>
  createdAt: string
}
```

**设计理由：**
- 中间结果不强制全部迁移到单独表，但 Runtime 层必须有统一引用模型
- 长文本与大结果应优先外置存储，避免堆进主业务表
- `entityType/entityId` 用于与现有业务实体建立映射

#### 2.4 ReasoningSnapshot

```ts
export interface ReasoningSnapshot {
  issue: {
    id: string
    title: string
    description: string
    domain?: string
    priority?: string
  }
  internalEvidenceIds: string[]
  externalEvidenceIds: string[]
  insightIds: string[]
  preflightLevel: 'standard' | 'degraded' | 'single_side' | 'refused'
  promptVersion: string
  modelPolicy: string
  triggeredBy: string
}
```

**设计理由：**
- reasoning run 的“为什么这样输出”必须可解释
- issue / evidence / insight 后续变化不应影响历史运行解释
- 将 prompt version 与 model policy 作为一等输入保留

#### 2.5 RuntimeOrchestrator

```ts
export interface RuntimeOrchestrator<TInput, TResult> {
  createRun(input: TInput): Promise<BaseRun>
  enqueue(run: BaseRun): Promise<void>
  resume(runId: string): Promise<void>
  fail(runId: string, error: Error): Promise<void>
  complete(runId: string, result: TResult): Promise<void>
}
```

**设计理由：**
- Orchestrator 统一负责生命周期
- Worker / Service 不再承担全局运行骨架语义
- 支持后续在不同链路上复用相同的生命周期管理模式

### 3. 首批接入的三条链路

#### 3.1 Ingestion Runtime

输入：
- `data_sources`
- 手动 sync / 定时 sync

编排步骤：

```txt
Create Import Run
  -> Create Import Tasks
  -> Fetch Source
  -> Normalize Content
  -> Deduplicate
  -> Create Evidence
  -> Emit evidence_created
  -> Trigger summarize/embed pipeline
```

Task 建议：
- `fetch_source`
- `normalize_content`
- `deduplicate_content`
- `persist_evidence`
- `emit_evidence_created`
- `trigger_postprocess`

映射关系：
- Run type: `import`
- 业务锚点: `import_jobs`
- Artifact: `raw_source`

**设计理由：**
- 保留 `import_jobs` 作为业务导入记录
- 新增 `runtime_runs` 提供统一执行视图
- `rss-worker` / `crawler-worker` 只负责 task 执行，不直接承担全局编排语义

#### 3.2 Adversarial Reasoning Runtime

采用现有 reasoning spec 的 9 态模型作为业务状态机来源，但在 Runtime Backbone 中增加统一 run/task/artifact/snapshot 结构。

运行主流程：

```txt
Create Reasoning Run
  -> Build Reasoning Snapshot
  -> Preflight Check
  -> Run Advocate
  -> Run Critic
  -> Extract Insights
  -> Run Judge
  -> Generate DecisionCard
  -> Complete Run
```

Task 建议：
- `prepare_reasoning_context`
- `run_preflight`
- `run_advocate`
- `run_critic`
- `extract_reasoning_insights`
- `run_judge`
- `generate_decision_card`

Reasoning 运行状态机继续兼容现有 9 态表达：

```txt
pending
 -> preparing
 -> advocate_running
 -> critic_running
 -> judge_running
 -> generating_card
 -> completed

failed / cancelled 可从中间任意节点进入
```

Artifact 建议：
- `advocate_output`
- `critic_output`
- `judge_output`
- `insight_result`
- `decision_card`

**设计理由：**
- reasoning 是最核心、最复杂、最需要解释能力的链路
- 先把该链路接入 runtime backbone，收益最大
- 兼容现有 `reasoning_runs`，避免一次性迁移破坏业务语义

#### 3.3 Closed-loop Learning Runtime（Review Summary）

主流程：

```txt
Create Review
  -> Create review_summary run
  -> Summarize Review
  -> Create historical Evidence
  -> Link generatedEvidenceId
  -> Trigger embed pipeline
```

Task 建议：
- `load_review_context`
- `generate_review_summary`
- `create_historical_evidence`
- `link_generated_evidence`
- `trigger_embedding`

业务锚点：
- `reviews`
- `generated_evidence_id`

Artifact 建议：
- `review_summary`
- `historical_evidence`

**设计理由：**
- 闭环回流是 ResearchOS 区别于单次推理系统的关键
- Runtime Backbone 必须覆盖“结果如何回流为下一轮输入”的链路
- 首批接入 review summary 可验证 runtime 是否支持闭环而非只支持前向执行

### 4. Context Builder

推理与长链运行的输入组装不应散落在 service 中，统一抽为 Context Builder。

```ts
export interface ReasoningContextBuilder {
  build(tenantId: string, issueId: string): Promise<ReasoningSnapshot>
}
```

构建内容：
- issue 基础信息
- 内部 / 外部 evidence 集
- insight 集合
- preflight 结果
- prompt version
- model policy

上下文分层：

- **System Layer**：固定规则、角色与输出约束
- **Snapshot Layer**：运行启动时的固定输入
- **Working Layer**：当前步骤所需动态上下文
- **Artifact Layer**：长文本和大结果按需 read-back

**设计理由：**
- 避免“把所有内容直接拼进 prompt”
- 让 prompt、snapshot、artifact、业务实体之间边界清晰
- 为调试、回放、压缩和成本治理提供基础

### 5. Runtime Events

统一事件定义，用于：
- SSE 推送
- 审计日志
- 调试追踪
- 指标采集

```ts
export type RuntimeEvent =
  | { type: 'status_change'; runId: string; status: string }
  | { type: 'progress'; runId: string; step: string; progress: number }
  | { type: 'agent_complete'; runId: string; agent: 'advocate' | 'critic' | 'judge' }
  | { type: 'insight_generated'; runId: string; insightId: string; title: string }
  | { type: 'completed'; runId: string; resultId?: string }
  | { type: 'error'; runId: string; message: string }
```

前端统一消费模型：

```ts
interface RunViewModel {
  id: string
  type: string
  status: string
  currentStep?: string
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  progress?: number
}
```

**设计理由：**
- 前端不应直接理解每个 Worker 的内部实现
- SSE 和内部状态事件应复用同一运行语义
- 保留 reasoning spec 已有事件体验，但统一为 runtime event shape

### 6. 数据持久化

建议新增三张表：

#### 6.1 runtime_runs

建议字段：
- id
- tenant_id
- issue_id nullable
- run_type
- status
- triggered_by nullable
- input_snapshot json
- output_snapshot json
- error_message nullable
- token_usage json nullable
- latency_ms nullable
- started_at
- completed_at nullable
- created_at
- updated_at

#### 6.2 runtime_tasks

建议字段：
- id
- run_id
- tenant_id
- task_type
- status
- depends_on json
- worker_name nullable
- input json nullable
- output json nullable
- error_message nullable
- started_at nullable
- completed_at nullable
- created_at
- updated_at

#### 6.3 runtime_artifacts

建议字段：
- id
- tenant_id
- run_id nullable
- issue_id nullable
- artifact_type
- entity_type nullable
- entity_id nullable
- storage_type
- storage_key
- summary nullable
- metadata json nullable
- created_at

与现有业务表关系：
- `reasoning_runs`: 保留，作为 reasoning 业务结果骨架
- `import_jobs`: 保留，作为 import 业务记录
- `reviews`: 保留，作为闭环学习业务锚点
- `evidence` / `insights` / `decision_cards`: 继续作为业务对象表
- runtime tables 负责统一执行语义，不替代业务实体

分阶段落地顺序：
1. 先加 `runtime_runs`
2. 再加 `runtime_artifacts`
3. 最后补 `runtime_tasks`

**设计理由：**
- 避免一次性 schema 改动过大
- 先让“统一运行视图”成立，再逐步补 task/artifact 深度能力
- 与当前 MVP 演进节奏更匹配

### 7. Recovery 语义

失败分类：

**可自动重试**
- 网络抓取失败
- 第三方 API 暂时失败
- 模型限流
- 短时存储异常

**需人工介入**
- 输入数据缺失
- 权限校验失败
- 数据不一致
- Prompt / 解析逻辑错误

恢复策略：

```txt
If task failed and retryable
  -> retry task with backoff
Else
  -> mark task failed
  -> mark run failed
  -> emit error event
  -> preserve completed artifacts
```

Resume 语义：

```txt
Resume(runId)
  -> load completed tasks
  -> load existing artifacts
  -> skip finished steps
  -> continue from first unfinished task
```

**设计理由：**
- 长链运行不能每次失败都从头开始
- artifact 必须在失败时保留，避免已完成结果丢失
- task-level 恢复比 run-level 全量重跑更符合成本与稳定性要求

### 8. Governance

#### 8.1 租户隔离
所有 Run / Task / Artifact 必须带 `tenant_id`，并复用现有 BaseRepository 多租户隔离原则。

#### 8.2 权限控制
按运行类型做权限分层：
- read run status
- trigger run
- retry failed run
- cancel running run
- view artifacts

#### 8.3 成本治理
对所有模型调用任务记录：
- model
- input tokens
- output tokens
- estimated cost
- latency

#### 8.4 审计
关键动作进入 audit log：
- 用户触发 reasoning
- 用户触发 import sync
- 用户重试 runtime run
- Review 自动生成 historical evidence

**设计理由：**
- Runtime Backbone 不是纯技术层，它必须内建治理边界
- 若治理后补，后续统一平台化成本会更高
- 成本与审计字段应该随着运行记录天然产生，而非事后拼接

## Risks / Trade-offs

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| Runtime 抽象过重，落地成本上升 | 影响短期交付节奏 | 首批只接入 import / reasoning / review summary 三条链 |
| 与现有业务表重复表达状态 | 增加理解成本 | 明确业务表保留业务语义，runtime 表只承载统一执行语义 |
| 事件统一可能影响现有 SSE 前端 | 前端兼容成本上升 | 先做 runtime event adapter，保持现有 reasoning SSE 兼容 |
| task-level resume 实现复杂 | 可能导致初版恢复逻辑不稳 | 第一阶段先保证 skip-completed + retryable task 即可 |
| artifact 外置增加存取复杂度 | 开发心智负担上升 | 先登记引用模型，不强制所有结果立即迁移出业务表 |

## References / Existing Specs

该设计与以下现有 spec / change 协同，不替代它们：

- `openspec/specs/runtime-backbone/spec.md`
- `openspec/specs/reasoning/spec.md`
- `openspec/specs/data-sources/spec.md`
- `openspec/specs/reviews/spec.md`
- `openspec/specs/shared-infra/spec.md`
- `openspec/changes/phase1-core-engine/proposal.md`
- `openspec/changes/phase2-loop-completion/proposal.md`
- `openspec/changes/phase2-loop-completion/design.md`
- `openspec/changes/phase0-foundation-fixes/proposal.md`
