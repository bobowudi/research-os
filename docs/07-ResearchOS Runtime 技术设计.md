# ResearchOS Runtime 技术设计文档

> 面向多源证据调研与决策闭环的 Runtime 内核技术设计

## 1. 设计目标

本文档描述 ResearchOS Runtime 的技术结构，目标不是再实现一组独立模块，而是把现有与规划中的能力组织成一套统一执行内核。

核心设计目标：

1. 统一运行抽象
2. 统一任务编排
3. 统一中间产物管理
4. 统一恢复与治理机制
5. 支撑 ResearchOS 的证据 → 推理 → 决策 → 行动 → 回看闭环

---

## 2. Runtime 设计原则

### 2.1 Issue-Centric
所有核心运行都围绕 `issue_id` 组织。即使某些运行来自数据源或回看，也应尽量在后续阶段回挂到 Issue 维度，便于追溯与分析。

### 2.2 Run First
不要只记录最终业务对象，要优先记录“这次运行是如何发生的”。

### 2.3 Artifact Externalization
长文本、大结果、结构化中间结果不应直接混在单个实体字段里，而应可作为独立 Artifact 被引用。

### 2.4 Async by Default
采集、embedding、立场分析、洞察提炼、推理、总结都默认按异步任务设计，前端通过轮询或 SSE 感知状态。

### 2.5 Recoverable Execution
任一步骤失败后，应能保留运行状态、错误上下文和已完成产物，支持重试或恢复。

### 2.6 Governance Built-in
租户隔离、权限校验、审计日志、模型成本统计应内建在 Runtime 中，而不是事后补充。

---

## 3. Runtime 分层

建议新增统一运行时目录：

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

各层职责如下。

## 3.1 core/
放置最基础抽象：
- Run 定义
- Task 定义
- 状态枚举
- 生命周期接口
- 通用执行器

## 3.2 orchestrators/
按业务链路组织编排器：
- ingestion orchestrator
- evidence intelligence orchestrator
- reasoning orchestrator
- review loop orchestrator

## 3.3 tasks/
封装最小执行步骤：
- fetch rss
- crawl page
- summarize evidence
- embed evidence
- analyze stance
- extract insights
- run advocate
- run critic
- run judge
- generate decision card
- summarize review

## 3.4 artifacts/
管理中间产物的存取、索引和引用。

## 3.5 context/
负责构建推理输入上下文，包括：
- issue snapshot
- evidence set
- insight set
- preflight result
- model policy
- prompt version

## 3.6 events/
统一定义运行事件，用于：
- SSE 推送
- 审计日志
- 调试追踪
- 指标采集

## 3.7 recovery/
实现失败恢复、任务重试、断点延续。

## 3.8 governance/
实现权限、租户隔离、审批、成本统计、模型策略校验。

---

## 4. 核心抽象

## 4.1 BaseRun

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

说明：
- `type` 用于统一不同业务运行
- `inputSnapshot` 固化输入环境，便于回放
- `outputSnapshot` 保留关键结果摘要
- `tokenUsage` 用于模型成本治理

## 4.2 RuntimeTask

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

说明：
- 一个 Run 可以拆为多个 Task
- `dependsOn` 允许 DAG 式编排，但当前阶段以简单串行/局部并行为主
- `workerName` 便于定位由哪个 Worker 执行

## 4.3 ArtifactRef

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

说明：
- Artifact 不要求全部新建独立存储表，但至少在 Runtime 层有统一引用模型
- 大文本可以落 S3/对象存储，结构化索引留在 DB

## 4.4 ReasoningSnapshot

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

说明：
- Reasoning Run 启动时必须固化
- 后续即使 issue 或 evidence 发生变更，也不影响历史解释

---

## 5. 运行链设计

## 5.1 Ingestion Runtime

### 输入
- `data_sources`
- 手动触发或定时触发 sync

### 编排步骤

```txt
Create Import Run
  -> Create ImportJob
  -> Fetch Source
  -> Normalize Content
  -> Deduplicate
  -> Create Evidence
  -> Emit evidence_created
  -> Trigger summarize/embed pipeline
```

### 关键对象映射
- Run: `import`
- Task: fetch / parse / dedup / persist
- Artifact: `raw_source`

### 落地建议
- 复用现有 `ImportJob` 作为业务记录
- 新增 Runtime Run 用于跨步骤状态统一
- `rss-worker`、`crawler-worker` 只负责执行 Task，不直接承担全局编排语义

---

## 5.2 Evidence Intelligence Runtime

### 输入
- 新 Evidence
- Evidence 与 Issue 建立关联
- 用户手动触发 AI 提炼

### 编排步骤

```txt
evidence_created
  -> summarize_evidence
  -> embed_evidence
  -> auto_associate_issue
  -> analyze_stance
  -> extract_insights(optional)
```

### 关键设计

#### 摘要
- 结果写回 `evidence.summary`
- 同时登记 `evidence_summary` artifact

#### embedding
- 向量写入 ES
- Runtime 层只保留 artifact 引用与执行记录

#### 立场分析
- 输入：issue snapshot + evidence summary/content
- 输出：`issue_evidence` 的 stance 字段更新
- 同时保留 `stance_result` artifact

#### 洞察提炼
- 可由独立按钮触发，也可在 reasoning 前自动触发
- 产物写入 `insights`，并登记 `insight_result` artifact

---

## 5.3 Adversarial Reasoning Runtime

这是 Runtime 内核的核心链路。

### 运行状态机

建议延续 OpenSpec 中的 9 态模型：

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

### 编排步骤

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

### Task 拆分建议

- `prepare_reasoning_context`
- `run_preflight`
- `run_advocate`
- `run_critic`
- `extract_reasoning_insights`
- `run_judge`
- `generate_decision_card`

### SSE Event 规范

保持现有 spec，并统一由 `runtime/events` 提供封装：

```ts
export type RuntimeEvent =
  | { type: 'status_change'; runId: string; status: string }
  | { type: 'progress'; runId: string; step: string; progress: number }
  | { type: 'agent_complete'; runId: string; agent: 'advocate' | 'critic' | 'judge' }
  | { type: 'insight_generated'; runId: string; insightId: string; title: string }
  | { type: 'completed'; runId: string; resultId?: string }
  | { type: 'error'; runId: string; message: string }
```

### Context Builder

建议把 reasoning 输入统一由 Context Builder 负责，而不是散落在 service 中：

```ts
export interface ReasoningContextBuilder {
  build(tenantId: string, issueId: string): Promise<ReasoningSnapshot>
}
```

构建内容包括：
- issue 基础信息
- 已确认内部证据
- 已确认外部证据
- 当前 insight 集合
- preflight level
- prompt version
- model policy

### Agent Output Artifact 化

Advocate / Critic / Judge 的输出不建议只放在 `reasoning_runs` 单表字段里，建议：
- 主摘要保留在 `reasoning_runs`
- 全量输出登记为 artifact

这样可避免：
- 单表字段过重
- 追溯困难
- 上下文复用不便

---

## 5.4 Closed-loop Learning Runtime

### 编排步骤

```txt
Create Review
  -> Create review_summary run
  -> Summarize Review
  -> Create historical Evidence
  -> Link generatedEvidenceId
  -> Trigger embed pipeline
```

### 技术重点

#### 幂等性
`SummaryWorker` 必须以 `generated_evidence_id` 作为幂等保护条件。

#### 结果映射
- Review outcome 决定历史证据置信度上限/默认值
- 生成证据需保留 `source_ref = review-{id}`

#### 闭环回流
新生成的 historical evidence 继续进入：
- embedding
- issue association
- 后续 reasoning context

这一步是 Runtime 闭环成立的关键。

---

## 6. Orchestrator 设计

建议以 Orchestrator 统一负责 Run 生命周期。

## 6.1 基础接口

```ts
export interface RuntimeOrchestrator<TInput, TResult> {
  createRun(input: TInput): Promise<BaseRun>
  enqueue(run: BaseRun): Promise<void>
  resume(runId: string): Promise<void>
  fail(runId: string, error: Error): Promise<void>
  complete(runId: string, result: TResult): Promise<void>
}
```

## 6.2 具体编排器

- `ImportOrchestrator`
- `EvidenceIntelligenceOrchestrator`
- `ReasoningOrchestrator`
- `ReviewLoopOrchestrator`

职责划分：
- Orchestrator：定义整条链的顺序与状态推进
- Worker / Service：执行具体一步
- Repository：落库
- Event Bus：广播状态更新

---

## 7. 数据持久化建议

当前项目已有大量业务表，建议采用“最小增量”方式落地 Runtime。

## 7.1 优先复用现有表

优先复用：
- `reasoning_runs`
- `import_jobs`
- `evidence`
- `issue_evidence`
- `insights`
- `decision_cards`
- `actions`
- `reviews`

## 7.2 建议新增表

### runtime_runs
统一记录所有运行。

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

### runtime_tasks
统一记录所有任务步骤。

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

### runtime_artifacts
统一记录中间产物引用。

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

如果不希望一次性加三张表，可按阶段落地：

1. 先加 `runtime_runs`
2. 再加 `runtime_artifacts`
3. 最后补 `runtime_tasks`

---

## 8. 事件与前端交互

## 8.1 事件来源
- Worker 状态推进
- Orchestrator 阶段切换
- Artifact 生成
- 最终完成/失败

## 8.2 事件消费方
- Issue 详情页
- Reasoning 面板
- Data Source 同步列表
- Review 列表
- 后续运行监控页

## 8.3 前端建议

前端不直接理解每个 Worker，而是理解统一运行状态：

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

这样可以避免前端绑死后端模块实现细节。

---

## 9. 恢复与重试设计

## 9.1 失败分类

### 可自动重试
- 网络抓取失败
- 第三方 API 暂时失败
- 模型限流
- 短时存储异常

### 需人工介入
- 输入数据缺失
- 权限校验失败
- 数据不一致
- Prompt / 解析逻辑错误

## 9.2 恢复策略

```txt
If task failed and retryable
  -> retry task with backoff
Else
  -> mark task failed
  -> mark run failed
  -> emit error event
  -> preserve completed artifacts
```

## 9.3 Resume 语义

对于长链运行，恢复时不应从头执行，而应：
- 读取已完成 task
- 跳过已有 artifact
- 从第一个未完成 task 继续

这要求 Orchestrator 具备 task-level resume 能力。

---

## 10. Context 管理设计

## 10.1 为什么需要独立 Context Layer

当前很多 AI 流程容易把：
- issue 内容
- evidence 内容
- insight 内容
- 历史运行结果

直接拼接进 prompt。

问题在于：
- 不可控
- 不可复用
- 不可调试
- 长上下文容易失控

所以应把上下文构建独立出来。

## 10.2 Context 分层

### System Layer
固定规则、角色定义、输出格式约束。

### Snapshot Layer
本次运行固定输入：issue/evidence/insight/preflight/model policy。

### Working Layer
当前步骤需要的动态上下文，例如 advocate 阶段只看内部证据。

### Artifact Layer
长文本和大结果只按需 read-back，不常驻 prompt。

## 10.3 Prompt Versioning

所有关键推理链建议记录：
- prompt version
- model name
- temperature
- maxTokens

便于：
- 对账
- A/B 比较
- 出问题时定位行为变化

---

## 11. 治理设计

## 11.1 租户隔离
所有 Run / Task / Artifact 必须带 `tenant_id`，并复用现有 BaseRepository 多租户隔离原则。

## 11.2 权限控制
建议按运行类型做权限分层：
- read run status
- trigger run
- retry failed run
- cancel running run
- view artifacts

## 11.3 成本治理
对所有涉及模型调用的 Task 记录：
- model
- input tokens
- output tokens
- estimated cost
- latency

## 11.4 审计
关键动作应进入 audit log：
- 用户触发 reasoning
- 用户手动覆盖 stance
- 用户触发 insight generation
- 用户重试 run
- Review 自动生成 historical evidence

---

## 12. 与现有模块的映射关系

## 12.1 evidence
从业务实体升级为 Runtime 输入资产。

## 12.2 issue_evidence
从简单关联表升级为“立场分析结果承载层”。

## 12.3 insights
从独立模块升级为推理前/推理中结构化中间层。

## 12.4 reasoning_runs
从单次结果记录升级为 Runtime Backbone 的核心业务对象。

## 12.5 decision_cards
作为 reasoning run 的主要业务输出。

## 12.6 reviews
作为闭环学习链的触发器。

---

## 13. 推荐落地顺序

## Step 1：统一 Run 抽象
先补 `runtime_runs`，并让：
- ImportJob
- ReasoningRun
- Review Summary

都能映射到统一 Run 视图。

## Step 2：统一事件流
抽出 `runtime/events`，统一 SSE 与内部状态事件。

## Step 3：统一 Context Builder
将 reasoning 上下文拼装逻辑集中化。

## Step 4：统一 Artifact 引用
把 advocate / critic / judge / summary 等中间结果纳入 artifact 模型。

## Step 5：统一恢复机制
引入 task-level retry / resume。

## Step 6：统一治理面板
沉淀成本、时延、失败率、审计信息。

---

## 14. 最终结构示意

```txt
[Frontend / API]
  Issue Detail / Reasoning Panel / Review UI / Data Source UI

        ↓

[Runtime Orchestrators]
  ImportOrchestrator
  EvidenceIntelligenceOrchestrator
  ReasoningOrchestrator
  ReviewLoopOrchestrator

        ↓

[Runtime Core]
  Run Registry
  Task Executor
  Event Bus
  Context Builder
  Artifact Manager
  Recovery Manager
  Governance Policy

        ↓

[Execution Layer]
  Services + BullMQ Workers + Claude API + ES + TiDB + Redis + S3

        ↓

[Storage Layer]
  runtime_runs / runtime_tasks / runtime_artifacts
  reasoning_runs / import_jobs / evidence / insights / decision_cards / reviews
```

---

## 15. 最终结论

ResearchOS 下一阶段不应继续只按模块堆功能，而应把系统中心切换到 Runtime。

技术上，它的关键不是再写几个 service，而是建立一套统一执行内核，使系统能稳定回答这些问题：

- 现在在跑什么？
- 这次运行为什么这样输出？
- 中间经历了哪些步骤？
- 哪一步失败了？
- 能不能恢复？
- 结果能否被下一轮继续利用？

因此可以把这份设计压缩成一句话：

> **ResearchOS Runtime = 以 Run / Task / Artifact / Snapshot 为核心抽象，围绕 Issue 编排证据、推理、决策与回看闭环的执行内核。**
