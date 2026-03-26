// ==================== 数据库基础仓库类 ====================

import { Kysely, SelectQueryBuilder } from 'kysely'
import type { Database } from '../schema/tables'

export abstract class BaseRepository<T extends keyof Database> {
  constructor(
    protected db: Kysely<Database>,
    protected tableName: T,
  ) {}

  /** 根据 ID 查询单条记录 */
  async findById(id: string) {
    return this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id' as any, '=', id)
      .executeTakeFirst()
  }

  /** 租户隔离的 ID 查询 */
  async findByIdAndTenant(id: string, tenantId: string) {
    return this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id' as any, '=', id)
      .where('tenant_id' as any, '=', tenantId)
      .executeTakeFirst()
  }

  /** 分页查询 */
  async findPaginated(params: {
    tenantId: string
    page: number
    pageSize: number
    orderBy?: string
    orderDir?: 'asc' | 'desc'
  }) {
    const { tenantId, page, pageSize, orderBy = 'created_at', orderDir = 'desc' } = params
    const offset = (page - 1) * pageSize

    const [items, countResult] = await Promise.all([
      this.db
        .selectFrom(this.tableName)
        .selectAll()
        .where('tenant_id' as any, '=', tenantId)
        .orderBy(orderBy as any, orderDir)
        .limit(pageSize)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom(this.tableName)
        .select(this.db.fn.count<number>('id' as any).as('total'))
        .where('tenant_id' as any, '=', tenantId)
        .executeTakeFirstOrThrow(),
    ])

    const total = Number(countResult.total)

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  /** 删除记录 */
  async deleteById(id: string, tenantId: string) {
    return this.db
      .deleteFrom(this.tableName)
      .where('id' as any, '=', id)
      .where('tenant_id' as any, '=', tenantId)
      .execute()
  }
}
