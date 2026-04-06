# Phase 0: 基础修复与框架搭建 — 技术设计

## Context

- **后端框架**: Next.js 14 App Router，API Routes 位于 `backend/app/api/`
- **数据库**: TiDB (MySQL 兼容)，通过 Kysely query builder 访问
- **认证中间件**: `backend/src/middleware/auth.ts` 提供 `withAuth(handler)` 高阶函数，解析 JWT 并注入 `auth` 对象（含 `userId`, `tenantId`, `role`）
- **Redis**: 已配置 Redis 连接，用于 session 和缓存
- **BullMQ**: 已在 `package.json` 中引入依赖，但尚未创建任何 Worker 或队列定义
- **权限矩阵**: `shared/constants/roles.ts` 导出 `hasPermission(role, resource, action)` 函数和权限配置，目前未在任何 route 中使用
- **已知问题**: M1 Issues 模块 (`backend/src/modules/issues/service.ts`) 存在 4 个 Bug（owner_name 硬编码、无搜索、sortBy 注入、无配额）

## Goals / Non-Goals

### Goals

- 修复 M1 Issues 后端 4 个已知 Bug，消除 SQL 注入安全漏洞
- 实现资源级 RBAC 权限中间件，完成认证 → 授权闭环
- 搭建 BullMQ Worker 基础框架，为 Phase 1-3 异步任务提供基础设施

### Non-Goals

- 不新增业务逻辑或新 API 端点
- 不修改数据库 Schema
- 不涉及前端变更
- 不实现具体的 Worker 业务逻辑（仅框架）
- 不做全文搜索优化（LIKE 足够满足当前数据量）

## Decisions

### 1. M1 Bug 修复方案

参考现有 `m1-issue-backend` 设计文档。以下为 4 个修复的具体实现。

#### 1.1 owner_name 修复

**问题**: `service.create()` 中 `owner_name` 硬编码为空字符串 `''`。

**方案**: 在创建议题前查询 `users` 表获取当前用户名称。

```typescript
// service.ts - create() 方法内
const user = await db
  .selectFrom('users')
  .select('name')
  .where('id', '=', auth.userId)
  .executeTakeFirst()

// 构建 insert 数据时
owner_name: user?.name || ''
```

**权衡**: 多一次 DB 查询（users 表按 id 主键查，<1ms）。可选方案是在 JWT 中携带 name，但会增大 token 体积且 name 变更后需要重新签发 token，故选择实时查询。

#### 1.2 搜索支持

**问题**: `service.list()` 不接受 `search` 参数，前端无法按标题搜索。

**方案**: 在 `list()` 方法中接受可选 `search` 参数，添加 LIKE 条件。

```typescript
// service.ts - list() 方法内
interface ListParams {
  tenantId: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

async list(params: ListParams) {
  let query = db
    .selectFrom('issues')
    .where('tenant_id', '=', params.tenantId)

  // 搜索条件
  if (params.search) {
    query = query.where('title', 'like', `%${params.search}%`)
  }

  // ... 排序、分页
}
```

**权衡**: `LIKE '%keyword%'` 无法使用索引，在数据量 <1000 条时性能可接受。后续如需全文搜索可引入 TiDB 的全文索引或外部搜索引擎。

#### 1.3 sortBy 白名单

**问题**: `sortBy` 参数直接拼入 SQL ORDER BY，存在 SQL 注入风险。

**方案**: 定义允许的排序字段白名单，非法值回退为默认值。

```typescript
// modules/issues/constants.ts
export const ALLOWED_SORT_BY = [
  'created_at',
  'updated_at',
  'decision_due_at',
  'evidence_count',
] as const

export type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number]

export const DEFAULT_SORT_BY: AllowedSortBy = 'created_at'
```

```typescript
// service.ts - list() 方法内
import { ALLOWED_SORT_BY, DEFAULT_SORT_BY } from './constants'

const safeSortBy = ALLOWED_SORT_BY.includes(rawSortBy as any)
  ? (rawSortBy as AllowedSortBy)
  : DEFAULT_SORT_BY

query = query.orderBy(safeSortBy, sortOrder)
```

**关键**: 这是安全修复，优先级最高。白名单模式比正则过滤更安全可靠。

#### 1.4 配额校验

**问题**: `service.create()` 未检查租户配额，可能导致资源滥用。

**方案**: 新增 `checkQuota()` 方法，在创建前校验。

```typescript
// service.ts

// 临时配额配置，后续从 tenants 表读取
const TENANT_QUOTAS: Record<string, { maxIssues: number }> = {
  free: { maxIssues: 50 },
  pro: { maxIssues: 500 },
  enterprise: { maxIssues: 5000 },
}

async checkQuota(tenantId: string, plan: string = 'free'): Promise<void> {
  const count = await db
    .selectFrom('issues')
    .select(db.fn.count<number>('id').as('total'))
    .where('tenant_id', '=', tenantId)
    .executeTakeFirstOrThrow()

  const quota = TENANT_QUOTAS[plan] || TENANT_QUOTAS.free

  if (Number(count.total) >= quota.maxIssues) {
    throw new AppError('已达议题数量上限', 409, 'QUOTA_EXCEEDED')
  }
}

// create() 方法开头调用
async create(auth: AuthContext, data: CreateIssueInput) {
  await this.checkQuota(auth.tenantId)
  // ... 原有创建逻辑
}
```

**权衡**: `plan` 暂时硬编码为 `'free'`，后续需从 `tenants` 表读取。COUNT 查询在有 `tenant_id` 索引的情况下性能良好。

### 2. 权限中间件设计

**方案**: 创建 `withPermission(resource, action)` 高阶函数，包装 `withAuth()`。

```typescript
// backend/src/middleware/permission.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthHandler, type AuthContext } from './auth'
import { hasPermission } from '@research-os/shared'

export type Resource =
  | 'issues'
  | 'evidence'
  | 'insights'
  | 'decisions'
  | 'actions'
  | 'reviews'
  | 'signals'
  | 'data_sources'
  | 'dashboard'
  | 'audit_logs'

export type Action = 'create' | 'read' | 'update' | 'delete'

export function withPermission(resource: Resource, action: Action) {
  return (handler: AuthHandler) =>
    withAuth(async (req: NextRequest, auth: AuthContext) => {
      if (!hasPermission(auth.role, resource, action)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: '权限不足',
            },
          },
          { status: 403 }
        )
      }
      return handler(req, auth)
    })
}
```

**设计理由**:

- **包装 withAuth 而非替换**: 保持认证逻辑不变，只在认证通过后追加授权校验
- **零 DB 查询**: 权限矩阵在 `shared/constants/roles.ts` 中以静态配置存在，`hasPermission()` 是纯函数调用，<1ms
- **类型安全**: `Resource` 和 `Action` 使用 union type，IDE 自动补全，编译期捕获错误
- **渐进式应用**: Phase 0 只在 issues / evidence / dashboard routes 完整应用，其他 routes 在各自 Phase 开发时补上，避免一次性改动过大

**Route 应用示例**:

```typescript
// app/api/issues/route.ts
import { withPermission } from '@/middleware/permission'

export const GET = withPermission('issues', 'read')(async (req, auth) => {
  // ... 原有逻辑
})

export const POST = withPermission('issues', 'create')(async (req, auth) => {
  await issueService.checkQuota(auth.tenantId)
  // ... 原有逻辑
})
```

```typescript
// app/api/issues/[id]/route.ts
export const GET = withPermission('issues', 'read')(async (req, auth) => { /* ... */ })
export const PATCH = withPermission('issues', 'update')(async (req, auth) => { /* ... */ })
export const DELETE = withPermission('issues', 'delete')(async (req, auth) => { /* ... */ })
```

### 3. Worker 基类设计

**方案**: 抽象基类封装 BullMQ Worker 的通用逻辑。

```typescript
// backend/src/workers/base-worker.ts
import { Worker, Job, type WorkerOptions } from 'bullmq'
import type IORedis from 'ioredis'

export abstract class BaseWorker<TData = unknown, TResult = unknown> {
  protected worker: Worker<TData, TResult> | null = null

  constructor(
    protected readonly queueName: string,
    protected readonly connection: IORedis
  ) {}

  /**
   * 子类必须实现的业务处理方法
   */
  abstract process(job: Job<TData>): Promise<TResult>

  /**
   * 启动 Worker
   */
  start(): void {
    this.worker = new Worker<TData, TResult>(
      this.queueName,
      (job) => this.process(job),
      {
        connection: this.connection,
        concurrency: this.getConcurrency(),
        limiter: this.getRateLimiter(),
      }
    )

    this.worker.on('failed', (job, err) => this.onFailed(job, err))
    this.worker.on('completed', (job, result) => this.onCompleted(job, result))
    this.worker.on('error', (err) => this.onError(err))

    console.log(
      `[Worker:${this.queueName}] Started with concurrency=${this.getConcurrency()}`
    )
  }

  /**
   * 优雅停止 Worker
   */
  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close()
      console.log(`[Worker:${this.queueName}] Stopped`)
    }
  }

  /**
   * 子类可覆盖的并发度配置，默认 1
   */
  protected getConcurrency(): number {
    return 1
  }

  /**
   * 子类可覆盖的速率限制配置，默认无限制
   */
  protected getRateLimiter(): WorkerOptions['limiter'] {
    return undefined
  }

  /**
   * Job 失败回调，子类可覆盖以自定义错误处理
   */
  protected onFailed(job: Job | undefined, err: Error): void {
    console.error(
      `[Worker:${this.queueName}] Job ${job?.id} failed:`,
      err.message
    )
  }

  /**
   * Job 完成回调，子类可覆盖以自定义完成处理
   */
  protected onCompleted(job: Job | undefined, result: TResult): void {
    console.log(`[Worker:${this.queueName}] Job ${job?.id} completed`)
  }

  /**
   * Worker 级别错误回调
   */
  protected onError(err: Error): void {
    console.error(`[Worker:${this.queueName}] Worker error:`, err.message)
  }
}
```

**设计理由**:

- **泛型 `<TData, TResult>`**: 每个 Worker 可定义自己的 Job 数据和结果类型，获得完整类型安全
- **抽象 `process()` 方法**: 子类只需关注业务逻辑，基类处理生命周期
- **可覆盖的 hooks**: `getConcurrency()`, `getRateLimiter()`, `onFailed()`, `onCompleted()` 均可按需覆盖
- **与 BullMQ 原生 API 对齐**: 不做过度封装，保留 BullMQ 的灵活性

### 4. 队列定义

```typescript
// backend/src/workers/queues.ts
import { Queue, type JobsOptions } from 'bullmq'
import type IORedis from 'ioredis'

/**
 * 队列名称常量
 */
export const QUEUE_NAMES = {
  REASONING: 'reasoning',
  CRAWLING: 'crawling',
  SIGNAL_DETECTION: 'signal-detection',
  EMBEDDING: 'embedding',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

/**
 * 各队列的默认 Job 选项
 */
export const QUEUE_OPTIONS: Record<QueueName, JobsOptions> = {
  [QUEUE_NAMES.REASONING]: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
  [QUEUE_NAMES.CRAWLING]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
  [QUEUE_NAMES.SIGNAL_DETECTION]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
  [QUEUE_NAMES.EMBEDDING]: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
} as const

/**
 * 队列实例缓存（单例模式）
 */
const queues = new Map<QueueName, Queue>()

/**
 * 获取或创建队列实例
 */
export function getQueue(name: QueueName, connection: IORedis): Queue {
  let queue = queues.get(name)
  if (!queue) {
    queue = new Queue(name, {
      connection,
      defaultJobOptions: QUEUE_OPTIONS[name],
    })
    queues.set(name, queue)
  }
  return queue
}

/**
 * 关闭所有队列连接
 */
export async function closeAllQueues(): Promise<void> {
  const promises = Array.from(queues.values()).map((q) => q.close())
  await Promise.all(promises)
  queues.clear()
}
```

**设计理由**:

- **QUEUE_NAMES 常量对象**: 避免字符串硬编码，所有引用方共享同一来源
- **QUEUE_OPTIONS 按队列独立配置**: reasoning 任务耗时长（timeout 隐含在消费端），重试少；crawling/signal/embedding 快速重试
- **removeOnComplete / removeOnFail**: 限制 Redis 中保留的 Job 数量，防止内存膨胀
- **getQueue 单例工厂**: 避免重复创建 Queue 实例，保证同名队列只有一个连接

### 5. Worker 注册策略

**方案**: 使用 Next.js `instrumentation.ts` hook，服务启动时自动注册所有 Worker。

```typescript
// backend/src/workers/index.ts
import type IORedis from 'ioredis'
import { BaseWorker } from './base-worker'

// Worker 实例注册表
const workers: BaseWorker[] = []

/**
 * 初始化并启动所有 Worker
 * 在 instrumentation.ts 中调用
 */
export async function initWorkers(connection: IORedis): Promise<void> {
  // Phase 0: 暂无具体 Worker，仅搭建框架
  // Phase 1+ 示例:
  // workers.push(new ReasoningWorker(connection))
  // workers.push(new CrawlingWorker(connection))

  for (const worker of workers) {
    worker.start()
  }

  console.log(`[Workers] Initialized ${workers.length} workers`)
}

/**
 * 优雅关闭所有 Worker
 */
export async function shutdownWorkers(): Promise<void> {
  console.log(`[Workers] Shutting down ${workers.length} workers...`)
  await Promise.all(workers.map((w) => w.stop()))
  console.log(`[Workers] All workers stopped`)
}

// 注册进程退出钩子
function registerShutdownHooks(): void {
  const shutdown = async () => {
    await shutdownWorkers()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

registerShutdownHooks()
```

```typescript
// backend/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { redis } = await import('./src/lib/redis')
    const { initWorkers } = await import('./src/workers/index')
    await initWorkers(redis)
  }
}
```

**设计理由**:

- **instrumentation.ts**: Next.js 14 官方推荐的 server startup hook，保证只在 Node.js 运行时执行一次
- **条件加载 `NEXT_RUNTIME === 'nodejs'`**: 避免 Edge Runtime 中加载 Node.js 依赖
- **Graceful shutdown**: SIGTERM / SIGINT 信号触发优雅关闭，等待当前 Job 完成后再退出

### 6. 权限应用策略

渐进式部署，按 Phase 逐步覆盖：

| Phase | Routes | 权限校验 |
|-------|--------|---------|
| Phase 0 | `issues/*`, `evidence/*`, `dashboard/*` | ✅ 完整应用 withPermission |
| Phase 1 | `insights/*`, `decisions/*` | 开发时添加 |
| Phase 2 | `actions/*`, `reviews/*` | 开发时添加 |
| Phase 3 | `signals/*`, `data_sources/*`, `audit_logs/*` | 开发时添加 |

**理由**: 一次性改动所有 routes 风险高、测试负担大。按 Phase 逐步添加，每个模块开发时同步完成权限校验，确保测试覆盖。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `LIKE '%keyword%'` 无法使用索引 | 大数据量下搜索变慢 | 当前议题数 <1000，性能可接受；后续可引入全文索引 |
| 配额 plan 硬编码为 `'free'` | 付费租户也受 free 限制 | TODO: 后续从 tenants 表读取 plan 字段 |
| Worker 框架无业务逻辑 | Phase 0 无法验证端到端流程 | 接口设计面向 Phase 1 填充，提供测试用例验证框架可用性 |
| `withPermission` 增加每请求一次函数调用 | 理论上增加延迟 | `hasPermission()` 是纯函数，<1ms，可忽略不计 |
| `removeOnComplete: 100` 可能丢失调试信息 | 无法追溯历史 Job | 生产环境可通过 BullMQ Dashboard 或增大保留数量解决 |
| `instrumentation.ts` 中 Worker 启动失败 | 整个后端服务无法启动 | Worker 初始化做 try-catch，失败不阻塞主服务，仅记录错误日志 |
