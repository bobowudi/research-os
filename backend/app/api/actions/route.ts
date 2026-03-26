// GET /api/actions — 列表
// POST /api/actions — 创建
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, created, readBody, parsePagination, parseQuery, generateId } from '@/shared/response'
import { createActionSchema } from '@research-os/shared/src/validators/entities'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'action', 'read')
  const { page, pageSize, sortOrder } = parsePagination(req.url)
  const query = parseQuery(req.url)
  const db = getDatabase()
  const offset = (page - 1) * pageSize

  let q = db.selectFrom('actions').selectAll().where('tenant_id', '=', auth.tenantId)
  if (query.issueId) q = q.where('issue_id', '=', query.issueId)
  if (query.status) q = q.where('status', '=', query.status as any)
  if (query.assigneeId) q = q.where('assignee_id', '=', query.assigneeId)

  const items = await q.orderBy('created_at', sortOrder).limit(pageSize).offset(offset).execute()
  return ok({ items, page, pageSize })
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'action', 'create')
  const body = await readBody(req)
  const input = createActionSchema.parse(body)
  const db = getDatabase()
  const id = generateId()

  let assigneeName: string | null = null
  if (input.assigneeId) {
    const user = await db.selectFrom('users').select(['name']).where('id', '=', input.assigneeId).executeTakeFirst()
    assigneeName = user?.name || null
  }

  await db.insertInto('actions').values({
    id,
    tenant_id: auth.tenantId,
    issue_id: input.issueId,
    decision_card_id: input.decisionCardId,
    parent_action_id: input.parentActionId || null,
    title: input.title,
    description: input.description,
    status: 'pending',
    priority: input.priority,
    assignee_id: input.assigneeId || null,
    assignee_name: assigneeName,
    due_at: input.dueAt || null,
    created_by: auth.userId,
  }).execute()

  const result = await db.selectFrom('actions').selectAll().where('id', '=', id).executeTakeFirst()
  return created(result)
})
