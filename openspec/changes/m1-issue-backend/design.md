## Context

后端使用 Next.js 14 App Router 作为 API 服务，Kysely ORM 连接 TiDB (MySQL 兼容)。认证/鉴权中间件 (`auth.ts`)、错误处理 (`error-handler.ts`)、响应工具 (`response.ts`) 已完善。共享包提供 Zod schema 和状态机。

当前 `issueService` 基础 CRUD 已实现，但有 4 个已知缺陷需修复。

## Goals / Non-Goals

**Goals:**
- 修复 owner_name 为空的 bug
- 添加标题模糊搜索 (SQL LIKE)
- 添加 sortBy 白名单防 SQL 注入
- 添加租户配额校验
- 保持现有 API 接口契约不变（向后兼容）

**Non-Goals:**
- 不引入 Elasticsearch 全文搜索（当前数据量 <1000 使用 LIKE 够用）
- 不添加乐观锁并发控制（后续迭代）
- 不修改数据库 schema（表已存在）
- 不添加 Redis 缓存

## Decisions

### 1. 修复 owner_name — 创建时 JOIN users 表

```typescript
// service.ts create() 方法
const user = await db
  .selectFrom('users')
  .select('name')
  .where('id', '=', auth.userId)
  .executeTakeFirst()

owner_name: user?.name || ''
```

**理由**: 一次额外查询，创建操作低频，性能影响可忽略。

### 2. 搜索 — SQL LIKE

```typescript
if (search) {
  query = query.where('title', 'like', `%${search}%`)
  countQuery = countQuery.where('title', 'like', `%${search}%`)
}
```

**理由**: Kysely 参数化查询自动防注入。数据量 <1000 时 LIKE 全表扫描 <200ms 可接受。

### 3. sortBy 白名单

```typescript
const ALLOWED_SORT_BY = ['created_at', 'updated_at', 'decision_due_at', 'evidence_count'] as const

const sortBy = ALLOWED_SORT_BY.includes(rawSortBy as any) ? rawSortBy : 'created_at'
```

**理由**: 防止恶意 sortBy 值导致 SQL 异常或信息泄露。

### 4. 配额校验 — COUNT 查询

```typescript
async checkQuota(tenantId: string): Promise<void> {
  const result = await db
    .selectFrom('issues')
    .select(db.fn.count<number>('id').as('total'))
    .where('tenant_id', '=', tenantId)
    .executeTakeFirstOrThrow()

  const currentCount = Number(result.total)
  const quota = TENANT_QUOTAS.free // TODO: 从 tenants 表读取 plan

  if (currentCount >= quota) {
    throw new AppError('已达议题数量上限，请升级套餐', 409, 'QUOTA_EXCEEDED')
  }
}
```

**理由**: 简单 COUNT 查询，创建操作低频。后续可从 tenants 表读取实际套餐等级。

### 5. 错误码

| HTTP | Code | Message | 触发 |
|------|------|---------|------|
| 409 | QUOTA_EXCEEDED | 已达议题数量上限 | 创建时超配额 |

### 6. Route Handler 变更

GET handler 增加 search 解析：
```typescript
const search = req.nextUrl.searchParams.get('search') || undefined
// 传入 issueService.list({ ..., search })
```

POST handler 增加配额校验：
```typescript
await issueService.checkQuota(auth.tenantId)
// 在 issueService.create() 之前调用
```

## Risks / Trade-offs

- **LIKE '%keyword%' 无法走索引**: 数据量增大后需迁移到 ES → 当前阶段可接受
- **配额读取硬编码为 free**: 后续需从 tenants 表读取实际 plan → TODO 标注
- **owner_name 冗余存储**: 用户改名后不同步 → 后续可加触发器或延迟更新
