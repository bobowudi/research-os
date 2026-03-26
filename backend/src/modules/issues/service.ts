// ==================== 议题服务 ====================

import { v4 as uuid } from 'uuid'
import { getDatabase } from '@research-os/database'
import type { AuthContext } from '@research-os/shared'
import { canTransition, ISSUE_TRANSITIONS } from '@research-os/shared'
import { NotFoundError, AppError } from '@/middleware/error-handler'
import type { IssueStatus } from '@research-os/shared'

export const issueService = {
  /** 创建议题 */
  async create(input: {
    title: string
    description: string
    domain: string
    tags: string[]
    decisionDueAt: string
  }, auth: AuthContext) {
    const db = getDatabase()
    const id = uuid()

    await db.insertInto('issues').values({
      id,
      tenant_id: auth.tenantId,
      title: input.title,
      description: input.description,
      domain: input.domain as any,
      status: 'draft',
      owner_id: auth.userId,
      owner_name: '', // TODO: 从 user 表查询
      tags: JSON.stringify(input.tags),
      decision_due_at: input.decisionDueAt,
    }).execute()

    return this.findById(id, auth.tenantId)
  },

  /** 查询单个议题 */
  async findById(id: string, tenantId: string) {
    const db = getDatabase()
    const issue = await db
      .selectFrom('issues')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst()

    if (!issue) throw new NotFoundError('Issue', id)
    return this.formatRow(issue)
  },

  /** 分页列表 */
  async list(params: {
    tenantId: string
    page: number
    pageSize: number
    status?: string
    domain?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const db = getDatabase()
    const { tenantId, page, pageSize, status, domain, sortBy = 'created_at', sortOrder = 'desc' } = params
    const offset = (page - 1) * pageSize

    let query = db.selectFrom('issues').selectAll().where('tenant_id', '=', tenantId)
    let countQuery = db.selectFrom('issues').select(db.fn.count<number>('id').as('total')).where('tenant_id', '=', tenantId)

    if (status) {
      query = query.where('status', '=', status as any)
      countQuery = countQuery.where('status', '=', status as any)
    }
    if (domain) {
      query = query.where('domain', '=', domain as any)
      countQuery = countQuery.where('domain', '=', domain as any)
    }

    const [items, countResult] = await Promise.all([
      query.orderBy(sortBy as any, sortOrder).limit(pageSize).offset(offset).execute(),
      countQuery.executeTakeFirstOrThrow(),
    ])

    const total = Number(countResult.total)

    return {
      items: items.map(this.formatRow),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },

  /** 更新议题 */
  async update(id: string, input: Record<string, any>, auth: AuthContext) {
    const db = getDatabase()
    const existing = await this.findById(id, auth.tenantId)

    // 状态变更校验
    if (input.status && input.status !== existing.status) {
      if (!canTransition(ISSUE_TRANSITIONS, existing.status as IssueStatus, input.status as IssueStatus)) {
        throw new AppError(`不允许从 ${existing.status} 转换到 ${input.status}`, 400, 'INVALID_TRANSITION')
      }
    }

    const updateData: any = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.domain !== undefined) updateData.domain = input.domain
    if (input.status !== undefined) updateData.status = input.status
    if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags)
    if (input.decisionDueAt !== undefined) updateData.decision_due_at = input.decisionDueAt

    if (Object.keys(updateData).length > 0) {
      await db.updateTable('issues').set(updateData).where('id', '=', id).where('tenant_id', '=', auth.tenantId).execute()
    }

    return this.findById(id, auth.tenantId)
  },

  /** 删除议题 */
  async delete(id: string, auth: AuthContext) {
    const db = getDatabase()
    await this.findById(id, auth.tenantId) // 确保存在
    await db.deleteFrom('issues').where('id', '=', id).where('tenant_id', '=', auth.tenantId).execute()
  },

  /** 行格式化：snake_case → camelCase */
  formatRow(row: any) {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title,
      description: row.description,
      domain: row.domain,
      status: row.status,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      decisionDueAt: row.decision_due_at,
      evidenceCount: row.evidence_count,
      insightCount: row.insight_count,
      decisionCardCount: row.decision_card_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },
}
