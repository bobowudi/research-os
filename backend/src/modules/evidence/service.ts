// ==================== 证据服务 ====================

import { v4 as uuid } from 'uuid'
import { getDatabase } from '@research-os/database'
import type { AuthContext } from '@research-os/shared'
import { NotFoundError } from '@/middleware/error-handler'

export const evidenceService = {
  /** 创建证据 */
  async create(input: any, auth: AuthContext) {
    const db = getDatabase()
    const id = uuid()

    await db.insertInto('evidence').values({
      id,
      tenant_id: auth.tenantId,
      source_category: input.sourceCategory,
      source_type: input.sourceType,
      source_label: input.sourceLabel,
      source_ref: input.sourceRef || '',
      content: input.content,
      summary: input.summary,
      tags: JSON.stringify(input.tags || []),
      confidence: input.confidence,
      confidence_factors: input.confidenceFactors ? JSON.stringify(input.confidenceFactors) : null,
      freshness_at: input.freshnessAt,
      citation: input.citation,
      attachment_urls: input.attachmentUrls ? JSON.stringify(input.attachmentUrls) : null,
      created_by: auth.userId,
    }).execute()

    return this.findById(id, auth.tenantId)
  },

  /** 查询单条证据 */
  async findById(id: string, tenantId: string) {
    const db = getDatabase()
    const row = await db.selectFrom('evidence').selectAll()
      .where('id', '=', id).where('tenant_id', '=', tenantId).executeTakeFirst()
    if (!row) throw new NotFoundError('Evidence', id)
    return this.formatRow(row)
  },

  /** 分页列表 */
  async list(params: {
    tenantId: string
    page: number
    pageSize: number
    sourceCategory?: string
    sourceType?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const db = getDatabase()
    const { tenantId, page, pageSize, sourceCategory, sourceType, sortBy = 'created_at', sortOrder = 'desc' } = params
    const offset = (page - 1) * pageSize

    let query = db.selectFrom('evidence').selectAll().where('tenant_id', '=', tenantId)
    let countQuery = db.selectFrom('evidence').select(db.fn.count<number>('id').as('total')).where('tenant_id', '=', tenantId)

    if (sourceCategory) {
      query = query.where('source_category', '=', sourceCategory as any)
      countQuery = countQuery.where('source_category', '=', sourceCategory as any)
    }
    if (sourceType) {
      query = query.where('source_type', '=', sourceType as any)
      countQuery = countQuery.where('source_type', '=', sourceType as any)
    }

    const [items, countResult] = await Promise.all([
      query.orderBy(sortBy as any, sortOrder).limit(pageSize).offset(offset).execute(),
      countQuery.executeTakeFirstOrThrow(),
    ])

    const total = Number(countResult.total)
    return { items: items.map(this.formatRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  },

  /** 关联证据到议题 */
  async linkToIssue(issueId: string, evidenceId: string, input: any, auth: AuthContext) {
    const db = getDatabase()

    await db.insertInto('issue_evidence').values({
      issue_id: issueId,
      evidence_id: evidenceId,
      relation_type: input.relationType || 'manual',
      relevance_score: input.relevanceScore || 0.5,
      stance: 'neutral',
      stance_source: 'manual',
      stance_confidence: 0,
      stance_reason: '',
      stance_analyzed_at: new Date().toISOString(),
    }).execute()

    // 更新议题证据计数
    await db.updateTable('issues')
      .set((eb: any) => ({ evidence_count: eb('evidence_count', '+', 1) }))
      .where('id', '=', issueId)
      .where('tenant_id', '=', auth.tenantId)
      .execute()
  },

  formatRow(row: any) {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      sourceCategory: row.source_category,
      sourceType: row.source_type,
      sourceLabel: row.source_label,
      sourceRef: row.source_ref,
      content: row.content,
      summary: row.summary,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      confidence: row.confidence,
      confidenceFactors: row.confidence_factors ? JSON.parse(row.confidence_factors) : undefined,
      freshnessAt: row.freshness_at,
      citation: row.citation,
      attachmentUrls: row.attachment_urls ? JSON.parse(row.attachment_urls) : undefined,
      importJobId: row.import_job_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  },
}
