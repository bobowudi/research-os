# Phase 0: 基础修复与框架搭建

## Why

MVP 闭环开发的前置条件。当前系统存在 3 类阻塞性问题：

1. **M1 后端安全漏洞 (Critical)**: sortBy 参数直接拼入 SQL，存在注入风险；owner_name 硬编码空字符串影响显示；缺少搜索和配额校验
2. **RBAC 权限校验缺失**: withAuth() 只做认证不做授权，任何登录用户可执行 admin 操作（如删除议题）
3. **异步任务基础缺失**: BullMQ 队列已配置但无 Worker，后续推理引擎(M5)、爬虫(M10)、信号检测(M9)、Embedding 全部依赖此基础

这些问题不修复，Phase 1-3 将在不安全、不完整的基础上进行。

## What Changes

### 变更 A: M1 后端 4 Bug 修复

1. **owner_name 硬编码空字符串** — `service.create()` 中 `owner_name` 被硬编码为 `''`，导致议题列表中创建者名称始终为空。修复方案：在创建议题前查询 `users` 表获取当前用户 `name`，赋值给 `owner_name`。
2. **缺少搜索支持** — `service.list()` 不支持按标题搜索，前端无法实现搜索功能。修复方案：接受 `search` 参数，添加 `WHERE title LIKE '%keyword%'` 条件。
3. **sortBy 无白名单 (SQL 注入风险)** — `service.list()` 的 `sortBy` 参数直接拼入 SQL ORDER BY 子句，攻击者可构造恶意 SQL。修复方案：定义允许的排序字段白名单 `ALLOWED_SORT_BY`，非法值回退为 `created_at`。
4. **缺少租户配额校验** — `service.create()` 未检查当前租户的议题数量是否已达上限，可能导致资源滥用。修复方案：新增 `checkQuota()` 方法，在创建前 COUNT 当前租户议题数并与配额比对，超限抛出 409 `QUOTA_EXCEEDED`。

### 变更 B: RBAC 资源级权限中间件

- `withPermission(resource, action)` 高阶函数，包装 `withAuth()`，在认证通过后进行资源级授权校验
- 基于 `shared/constants/roles.ts` 中已有的权限矩阵，调用 `hasPermission(role, resource, action)` 判断
- 应用到所有现有 route handler，确保不同角色（admin / analyst / viewer）只能执行其权限范围内的操作
- Phase 0 阶段完整应用于 issues routes，其余 routes 在各自 Phase 开发时补上

### 变更 C: BullMQ Worker 基础框架

- `BaseWorker<TData, TResult>` 抽象基类，封装 Worker 创建、启动、停止、错误处理、重试、日志
- `initWorkers()` 注册入口函数，在 Next.js `instrumentation.ts` 中调用，服务启动时自动初始化
- 通用错误处理：`failed` / `completed` 事件监听，结构化日志输出
- 可配置并发度 (`getConcurrency()`) 和速率限制 (`getRateLimiter()`)
- 4 个队列定义及默认 Job 选项：
  - `reasoning` — 推理引擎 (M5)，timeout 120s，重试 2 次
  - `crawling` — 爬虫 (M10)，timeout 60s，重试 3 次
  - `signal-detection` — 信号检测 (M9)，重试 3 次
  - `embedding` — Embedding 生成，重试 3 次
- Graceful shutdown：进程退出时依次关闭所有 Worker

## Capabilities

### New

- **rbac-middleware** — 资源级权限校验中间件 `withPermission(resource, action)`，基于 shared 权限矩阵，零数据库查询，<1ms 开销
- **bullmq-worker-framework** — BullMQ Worker 抽象基类 + 队列定义 + 注册入口，为 Phase 1-3 的异步任务提供统一基础设施

### Modified

- **issue-api-backend** — 修复 4 个已知 Bug（owner_name、search、sortBy 白名单、配额校验），消除安全漏洞和功能缺失

## Impact

### 新增文件 (5)

| 文件路径 | 说明 |
|---------|------|
| `backend/src/middleware/permission.ts` | RBAC 权限中间件，withPermission() 高阶函数 |
| `backend/src/modules/issues/constants.ts` | Issues 模块常量：ALLOWED_SORT_BY 白名单、DEFAULT_SORT_BY |
| `backend/src/workers/index.ts` | Worker 注册入口，initWorkers() + graceful shutdown |
| `backend/src/workers/base-worker.ts` | BaseWorker 抽象基类 |
| `backend/src/workers/queues.ts` | 队列名称常量 QUEUE_NAMES + 默认 Job 选项 QUEUE_OPTIONS |

### 修改文件 (4+)

| 文件路径 | 变更内容 |
|---------|---------|
| `backend/src/modules/issues/service.ts` | 修复 owner_name、添加 search、sortBy 白名单、新增 checkQuota() |
| `backend/app/api/issues/route.ts` | 解析 search query 参数、create 前调用 checkQuota()、应用 withPermission |
| `backend/app/api/issues/[id]/route.ts` | GET/PATCH/DELETE 分别应用 withPermission 权限校验 |
| `backend/instrumentation.ts` | 添加 initWorkers() 调用 |
| 其他现有 route handlers | 渐进式添加 withPermission（Phase 0 仅 issues + evidence + dashboard） |

### 不涉及

- 无数据库 Schema 变更
- 无前端变更
- 无新业务逻辑 / 新 API 端点
- 无第三方服务集成变更
