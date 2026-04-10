# Runtime Backbone — 基线规格

> 最后更新: 2026-04-08

## 状态: 规划中

Runtime Backbone 为 ResearchOS 的关键运行链提供统一执行骨架。它不替代 import、reasoning、review summary 等业务模块，也不重写它们已有的业务语义；它负责把这些链路统一提升为共享的 Run / Task / Artifact / Snapshot / Event / Recovery / Governance 模型，使系统能够提供统一运行视图、恢复语义、中间产物引用和治理能力。

当前状态：`openspec/changes/runtime-backbone/` 已定义 proposal / design / tasks；基线 specs 在本文件中补充横切执行约束。

---

## 模块定位

```txt
业务链路
  import / reasoning / review summary
          │
          ▼
┌──────────────────────────────────────────────┐
│            Runtime Backbone                   │
│                                              │
│  Run Registry                                │
│  Task Tracking                               │
│  Artifact Registry                           │
│  Snapshotting                                │
│  Event Stream                                │
│  Recovery / Governance                       │
└──────────────────────────────────────────────┘
          │
          ▼
统一运行查询 / SSE 映射 / 恢复 / 审计 / 成本治理
```

- **上承业务模块**：Import、Reasoning、Review Summary 等执行链
- **下接执行层**：Workers、Services、BullMQ、TiDB、Redis、ES、对象存储、Claude API
- **横切能力**：统一状态、统一事件、统一产物引用、统一恢复与治理

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | Runtime Run Registry | 为关键运行链提供统一 run 记录与查询视图 | 规划中 |
| F2 | Runtime Task Tracking | 将单次 run 拆分为可追踪 task 步骤 | 规划中 |
| F3 | Runtime Artifact Registry | 统一登记中间产物引用 | 规划中 |
| F4 | Runtime Snapshotting | 固化长链运行启动时的输入环境 | 规划中 |
| F5 | Runtime Event Stream | 统一事件协议并支持 SSE 适配 | 规划中 |
| F6 | Runtime Recovery | 支持 retryable / non-retryable 分类与 resume | 规划中 |
| F7 | Runtime Governance | 统一租户隔离、审计、成本与权限边界 | 规划中 |

---

## 规范要求

### 1. Runtime Run Registry

1. 系统 MUST 为至少以下运行链提供统一 runtime run：`import`、`reasoning`、`review_summary`
2. 每个 runtime run MUST 带 `tenant_id`
3. runtime run MUST 支持记录以下基础字段：
   - `type`
   - `status`
   - `input_snapshot`
   - `output_snapshot`
   - `error_message`
   - `started_at`
   - `completed_at`
4. runtime run SHOULD 支持关联业务锚点，例如 `issue_id`、`review_id`、`data_source_id` 或其他相关实体
5. runtime run MUST 提供统一查询视图，而不要求替代现有业务表语义

### 2. Runtime Task Tracking

1. 单次 runtime run MAY 拆分为多个 runtime tasks
2. 每个 runtime task MUST 带 `run_id`、`tenant_id`、`task_type`、`status`
3. runtime task SHOULD 支持 `depends_on`，以表达串行或局部并行依赖
4. runtime task MUST 支持记录：
   - `input`
   - `output`
   - `error_message`
   - `started_at`
   - `completed_at`
5. 系统 MUST 能读取某个 run 下已完成与未完成 task，以支持恢复与调试

### 3. Runtime Artifact Registry

1. 系统 MUST 提供统一 artifact 引用模型，用于登记运行中间结果
2. 每个 artifact MUST 带 `tenant_id`
3. artifact MUST 支持记录：
   - `type`
   - `storage_type`
   - `storage_key`
   - `run_id`（如适用）
   - `issue_id`（如适用）
   - `entity_type` / `entity_id`（如适用）
4. 大体积结果 MAY 外置存储，但 runtime 层 MUST 保留引用
5. artifact MUST 支持至少按 `run_id`、`issue_id`、`entity_type + entity_id` 查询

### 4. Runtime Snapshotting

1. 长链运行启动时 MUST 固化输入 snapshot，避免后续业务实体变化影响历史解释
2. reasoning run MUST 记录 issue / evidence / insight / preflight / promptVersion / modelPolicy 等关键输入
3. import 与 review summary 等运行 SHOULD 根据链路需要记录启动时输入环境
4. 历史运行解释 MUST 优先基于 snapshot，而不是完全依赖实时业务表回查

### 5. Runtime Event Stream

1. 系统 MUST 提供统一 runtime event shape
2. 统一事件模型 MUST 至少支持：
   - `status_change`
   - `progress`
   - `completed`
   - `error`
3. 具体链路 MAY 扩展更细事件，例如 `agent_complete`、`insight_generated`
4. 面向前端的 SSE 事件 SHOULD 通过统一 runtime event adapter 输出，而不是直接暴露 worker 内部状态细节

### 6. Runtime Recovery

1. 系统 MUST 区分 retryable 与 non-retryable failure
2. task-level 恢复 SHOULD 优先于 run-level 全量重跑
3. resume MUST 支持跳过已完成 task（skip-completed）
4. 已完成 task 产生的 artifacts MUST 在失败、重试或恢复时保留
5. 失败信息 MUST 可被统一查询与审计读取

### 7. Runtime Governance

1. runtime 查询、task 查询、artifact 查询 MUST 遵守 tenant scope 隔离
2. runtime trigger / retry / fail / cancel 等关键动作 SHOULD 进入审计记录
3. 涉及模型调用的运行或任务 SHOULD 记录：
   - `model`
   - `input tokens`
   - `output tokens`
   - `estimated cost`
   - `latency`
4. runtime 权限控制 SHOULD 至少区分：
   - read run status
   - trigger run
   - retry failed run
   - cancel running run
   - view artifacts

---

## 与业务模块的关系

1. Runtime Backbone MUST 作为共享执行抽象存在，不替代 `reasoning_runs`、`import_jobs`、`reviews` 等业务表语义
2. 业务模块仍负责自身领域对象与业务规则；Runtime Backbone 负责统一执行语义、状态追踪、恢复、事件与治理
3. 新接入链路 SHOULD 优先复用 Runtime Backbone，而不是在业务模块内重复实现独立的 run/task/event/recovery 机制

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `openspec/changes/runtime-backbone/proposal.md` | Runtime Backbone 变更提案 |
| `openspec/changes/runtime-backbone/design.md` | Runtime Backbone 技术设计 |
| `openspec/changes/runtime-backbone/tasks.md` | Runtime Backbone 实施拆分 |
| `openspec/specs/reasoning/spec.md` | reasoning runtime 集成要求 |
| `openspec/specs/data-sources/spec.md` | import runtime 集成要求 |
| `openspec/specs/reviews/spec.md` | review summary runtime 集成要求 |
