# Phase 0: 基础修复与框架搭建 — 任务清单

## 1. M1 后端 Bug 修复

- [ ] 1.1 创建 `backend/src/modules/issues/constants.ts` — 定义 `ALLOWED_SORT_BY` 白名单数组（`created_at`, `updated_at`, `decision_due_at`, `evidence_count`）、`AllowedSortBy` 类型、`DEFAULT_SORT_BY` 默认值（`created_at`）
- [ ] 1.2 修复 `service.create()` — 在创建议题前查询 `users` 表获取当前用户 `name`，赋值给 `owner_name`（替换硬编码空字符串）
- [ ] 1.3 修复 `service.list()` — 添加可选 `search` 参数，当存在时追加 `WHERE title LIKE '%keyword%'` 条件
- [ ] 1.4 修复 `service.list()` — 导入 `ALLOWED_SORT_BY`，对 `sortBy` 参数做白名单校验，非法值回退为 `DEFAULT_SORT_BY`（`created_at`），消除 SQL 注入风险
- [ ] 1.5 新增 `service.checkQuota()` — 按 `tenant_id` COUNT 当前议题数，与 `TENANT_QUOTAS[plan].maxIssues` 比对，超限抛出 `AppError('已达议题数量上限', 409, 'QUOTA_EXCEEDED')`
- [ ] 1.6 修改 `app/api/issues/route.ts` GET handler — 从 URL searchParams 解析 `search` 参数，传入 `service.list()` 调用
- [ ] 1.7 修改 `app/api/issues/route.ts` POST handler — 在调用 `service.create()` 前调用 `service.checkQuota(auth.tenantId)`
- [ ] 1.8 手动测试 — 验证以下场景全部通过：
  - 搜索: GET `/api/issues?search=关键词` 返回匹配结果
  - 排序: GET `/api/issues?sortBy=updated_at` 正常排序；`sortBy=DROP TABLE` 回退为 `created_at`
  - 配额: 达到上限后 POST `/api/issues` 返回 409 `QUOTA_EXCEEDED`
  - owner_name: 新建议题后查看 `owner_name` 字段为实际用户名
  - 回归: 现有 CRUD 功能不受影响

## 2. RBAC 权限中间件

- [ ] 2.1 创建 `backend/src/middleware/permission.ts` — 实现 `withPermission(resource: Resource, action: Action)` 高阶函数，内部调用 `withAuth()` 包装，认证通过后调用 `hasPermission(auth.role, resource, action)` 校验权限，失败返回 403 `{ success: false, error: { code: 'FORBIDDEN', message: '权限不足' } }`
- [ ] 2.2 重构 `app/api/issues/route.ts` — GET handler 用 `withPermission('issues', 'read')` 包装，POST handler 用 `withPermission('issues', 'create')` 包装，替换原有的 `withAuth()`
- [ ] 2.3 重构 `app/api/issues/[id]/route.ts` — GET 用 `withPermission('issues', 'read')`，PATCH 用 `withPermission('issues', 'update')`，DELETE 用 `withPermission('issues', 'delete')`，替换原有的 `withAuth()`
- [ ] 2.4 为 `app/api/evidence/route.ts` 添加 `withPermission` — GET 用 `('evidence', 'read')`，POST 用 `('evidence', 'create')`
- [ ] 2.5 为 `app/api/dashboard/route.ts` 添加 `withPermission('dashboard', 'read')` — 仪表盘只读权限
- [ ] 2.6 手动测试 — 使用三种角色分别测试：
  - **admin**: issues CRUD 全部可操作，dashboard 可读 ✅
  - **analyst**: issues 可读/创建/更新，不可删除 (403) ✅
  - **viewer**: issues 只读，不可创建/更新/删除 (403)，dashboard 可读 ✅
  - 未登录用户: 所有接口返回 401 ✅

## 3. BullMQ Worker 框架

- [ ] 3.1 创建 `backend/src/workers/queues.ts` — 定义 `QUEUE_NAMES` 常量对象（`reasoning`, `crawling`, `signal-detection`, `embedding`）、`QueueName` 类型、`QUEUE_OPTIONS` 各队列默认 Job 选项（重试次数、退避策略、removeOnComplete/removeOnFail）、`getQueue()` 单例工厂函数、`closeAllQueues()` 清理函数
- [ ] 3.2 创建 `backend/src/workers/base-worker.ts` — 实现 `BaseWorker<TData, TResult>` 抽象基类，包含抽象 `process()` 方法、`start()` / `stop()` 生命周期方法、可覆盖的 `getConcurrency()` / `getRateLimiter()` / `onFailed()` / `onCompleted()` / `onError()` 钩子
- [ ] 3.3 创建 `backend/src/workers/index.ts` — 实现 `initWorkers(connection)` 注册函数（Phase 0 暂无具体 Worker）、`shutdownWorkers()` 优雅关闭函数、注册 `SIGTERM` / `SIGINT` 进程退出钩子
- [ ] 3.4 在 `backend/instrumentation.ts` 中添加 Worker 初始化 — 在 `register()` 函数中判断 `NEXT_RUNTIME === 'nodejs'` 后动态导入 Redis 连接和 `initWorkers()`，用 try-catch 包裹确保 Worker 启动失败不阻塞主服务
- [ ] 3.5 手动测试 — 验证 Worker 框架可用：
  - 服务启动时控制台输出 `[Workers] Initialized 0 workers`（Phase 0 无具体 Worker）
  - 创建临时测试 Worker 继承 BaseWorker，验证 Job 能正常入队和消费
  - SIGTERM 信号触发时控制台输出 `[Workers] All workers stopped`
  - 删除测试 Worker 代码，确保框架代码干净
