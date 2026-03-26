// GET /api/reviews — 列表
// POST /api/reviews — 创建
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, created, readBody, parsePagination, parseQuery, generateId } from '@/shared/response'
import { createReviewSchema } from '@research-os/shared/src/validators/entities'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'review', 'read')
  const { page, pageSize, sortOrder } = parsePagination(req.url)
  const query = parseQuery(req.url)
  const db = getDatabase()
  const offset = (page - 1) * pageSize

  let q = db.selectFrom('reviews').selectAll().where('tenant_id', '=', auth.tenantId)
  if (query.issueId) q = q.where('issue_id', '=', query.issueId)

  const items = await q.orderBy('created_at', sortOrder).limit(pageSize).offset(offset).execute()
  return ok({ items, page, pageSize })
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'review', 'create')
  const body = await readBody(req)
  const input = createReviewSchema.parse(body)
  const db = getDatabase()
  const id = generateId()

  await db.insertInto('reviews').values({
    id,
    tenant_id: auth.tenantId,
    issue_id: input.issueId,
    decision_card_id: input.decisionCardId,
    action_id: input.actionId || null,
    outcome: input.outcome,
    actual_result: input.actualResult,
    expected_result: input.expectedResult,
    deviation: input.deviation,
    lessons_learned: input.lessonsLearned,
    tags: JSON.stringify(input.tags),
    reviewed_by: auth.userId,
    reviewed_at: new Date().toISOString(),
  }).execute()

  const result = await db.selectFrom('reviews').selectAll().where('id', '=', id).executeTakeFirst()
  return created(result)
})
