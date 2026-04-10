# Runtime Backbone

- **类型**: Cross-cutting Runtime Backbone
- **阶段定位**: Shared execution layer for existing core business flows
- **前置依赖**:
  - `phase0-foundation-fixes`（BullMQ Worker 框架、RBAC 中间件、基础设施修复）
  - `phase1-core-engine`（Evidence / Data Source / Embedding / Reasoning / Decision）
  - `phase2-loop-completion`（Insight / Stance / Action / Review loop）

## Why

ResearchOS 已通过 `phase1-core-engine` 和 `phase2-loop-completion` 定义了核心业务闭环，但系统当前的运行语义仍然分散在各个模块内部：

- `reasoning_runs` 负责对抗推理运行
- `import_jobs` 负责数据采集状态
- `reviews.generated_evidence_id` 隐式承载闭环回流
- SSE 事件、Worker 状态、AI 中间结果、失败恢复语义尚未统一

这意味着系统虽然已经具备多个“会运行”的模块，但还没有形成统一的 Runtime Backbone。继续按模块扩展会带来几个问题：

1. **状态割裂**：前端和平台只能看到各模块自己的状态，无法获得统一运行视图
2. **恢复困难**：失败后的 resume / retry 逻辑分散在不同 Worker 和 Service 中
3. **产物不可复用**：advocate / critic / judge / summary / stance / insight 等中间结果缺少统一 artifact 引用模型
4. **事件协议分散**：Reasoning SSE、Import 状态、Review 回流状态难以被统一消费
5. **治理成本上升**：token、latency、estimated cost、租户隔离、权限控制无法作为统一运行时能力沉淀

ResearchOS 下一步不应继续只增加模块能力，而应补上统一执行骨架，使系统从“模块集合”升级为“执行系统”。

## What Changes

### 变更 A: Runtime Run Backbone
新增统一 `runtime_runs` 抽象，作为 Import / Reasoning / Review Summary 等关键运行链的共享运行骨架。

目标：
- 为不同运行链提供统一 Run 视图
- 统一记录输入快照、输出摘要、状态、失败信息、token/cost/latency
- 让前端与治理层可以用一致模型消费运行状态

首批接入：
- import run
- reasoning run
- review summary run

### 变更 B: Runtime Task Orchestration
新增 `runtime_tasks` 抽象，把单次 Run 拆解为可追踪、可恢复的 Task 步骤。

目标：
- 支持串行 / 局部并行步骤追踪
- 为 retry / resume 提供 task-level 基础
- 让 Worker 从“直接代表整条链”转为“执行某个 task”

首批覆盖：
- ingestion pipeline tasks
- reasoning pipeline tasks
- review summary pipeline tasks

### 变更 C: Runtime Artifact & Snapshot Layer
新增 `runtime_artifacts` 与统一 snapshot 模型，承载中间产物引用与输入固化。

目标：
- 统一登记长文本、大结果、结构化中间结果
- 固化 reasoning/import/review 等运行启动时的输入环境
- 支持追溯、审计、复用与回放

首批 artifact 类型包括：
- raw source
- evidence summary
- stance result
- insight result
- advocate / critic / judge outputs
- decision card
- review summary
- historical evidence reference

### 变更 D: Runtime Events / Recovery / Governance
统一运行事件、失败分类、恢复语义与治理字段。

目标：
- 统一 SSE / 内部事件协议
- 统一 retryable / non-retryable failure 分类
- 建立 task-level resume 语义
- 统一记录 model、token、latency、estimated cost
- 复用现有多租户与权限边界实现 Runtime 治理能力

## Capabilities

### New
- **runtime-run-registry**: 统一运行记录与运行视图
- **runtime-task-tracking**: 统一任务步骤追踪与依赖管理
- **runtime-artifact-registry**: 统一中间产物引用模型
- **runtime-snapshotting**: 运行输入快照固化
- **runtime-event-stream**: 统一运行事件输出
- **runtime-recovery-governance**: 统一恢复、审计、成本与权限治理

### Modified
- **adversarial-reasoning**: 接入统一 runtime run/task/artifact/event 模型
- **data-source-management**: ImportJob 运行接入 runtime backbone
- **review-learning-loop**: Review Summary 接入统一 runtime backbone

## Non-Goals

本 change 明确不包含以下内容：

- 不重写 `phase1-core-engine` 和 `phase2-loop-completion` 已定义的业务能力
- 不引入自由对话式多 Agent 平台
- 不实现完整的运行监控大盘或图形化工作流编排器
- 不要求一次性让所有模块都接入统一 runtime
- 不在本 change 内新增新的核心业务对象（如新的决策、行动、洞察产品能力）
- 不替代现有 `reasoning_runs`、`import_jobs`、`reviews` 的业务语义，只在其上补统一执行抽象

## Impact

新增文件（预期）：

**OpenSpec:**
- `openspec/changes/runtime-backbone/proposal.md`
- `openspec/changes/runtime-backbone/design.md`
- `openspec/changes/runtime-backbone/tasks.md`
- `openspec/specs/runtime-backbone/spec.md`
- `openspec/specs/reasoning/spec.md`（runtime integration delta）
- `openspec/specs/data-sources/spec.md`（runtime integration delta）
- `openspec/specs/reviews/spec.md`（runtime integration delta）

**Backend Runtime Layer:**
- `backend/src/runtime/core/*`
- `backend/src/runtime/orchestrators/*`
- `backend/src/runtime/tasks/*`
- `backend/src/runtime/artifacts/*`
- `backend/src/runtime/context/*`
- `backend/src/runtime/events/*`
- `backend/src/runtime/recovery/*`
- `backend/src/runtime/governance/*`

**Database / Shared Types:**
- `database/src/migrations/*`（runtime tables）
- `shared/*`（如需共享 runtime 类型）

**Integration points（修改）:**
- `backend/src/modules/reasoning/*`
- `backend/src/workers/reasoning-worker.ts`
- `backend/src/workers/rss-worker.ts`
- `backend/src/workers/crawler-worker.ts`
- `backend/src/workers/summary-worker.ts`
- `backend/src/workers/index.ts`
- `backend/app/api/issues/[id]/reasoning/route.ts`
- `backend/app/api/data-sources/[id]/sync/route.ts`
- `backend/app/api/reviews/*`（如存在）
