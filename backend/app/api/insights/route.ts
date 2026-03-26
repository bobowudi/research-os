// GET /api/insights — 列表
// POST /api/insights — 创建
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, created, readBody, parsePagination, parseQuery, generateId } from '@/shared/response'
import { createInsightSchema } from '@research-os/shared/src/validators/entities'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'insight', 'read')
  const { page, pageSize, sortOrder } = parsePagination(req.url)
  const query = parseQuery(req.url)
  const db = getDatabase()
  const offset = (page - 1) * pageSize

  let q = db.selectFrom('insights').selectAll().where('tenant_id', '=', auth.tenantId)
  if (query.issueId) q = q.where('issue_id', '=', query.issueId)
  if (query.type) q = q.where('type', '=', query.type as any)
  if (query.status) q = q.where('status', '=', query.status as any)

  const items = await q.orderBy('created_at', sortOrder).limit(pageSize).offset(offset).execute()
  return ok({ items, page, pageSize })
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'insight', 'create')
  const body = await readBody(req)
  const input = createInsightSchema.parse(body)
  const db = getDatabase()
  const id = generateId()

  await db.insertInto('insights').values({
    id,
    tenant_id: auth.tenantId,
    issue_id: input.issueId,
    title: input.title,
    description: input.description,
    type: input.type,
    status: 'draft',
    source: 'manual',
    direction: input.direction,
    confidence: input.confidence,
    score: input.score,
    created_by: auth.userId,
  }).execute()

  // 创建 insight_evidence 关联
  for (const eid of input.evidenceIds) {
    await db.insertInto('insight_evidence').values({
      insight_id: id,
      evidence_id: eid,
      support_type: 'supports',
    }).execute()
  }

  const result = await db.selectFrom('insights').selectAll().where('id', '=', id).executeTakeFirst()
  return created(result)
})
