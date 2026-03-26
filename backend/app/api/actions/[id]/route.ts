// GET /api/actions/:id
// PATCH /api/actions/:id
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler, NotFoundError } from '@/middleware/error-handler'
import { ok, readBody } from '@/shared/response'
import { updateActionSchema } from '@research-os/shared/src/validators/entities'

interface Params { params: { id: string } }

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'action', 'read')
  const db = getDatabase()
  const action = await db.selectFrom('actions').selectAll()
    .where('id', '=', params.id).where('tenant_id', '=', auth.tenantId).executeTakeFirst()
  if (!action) throw new NotFoundError('Action', params.id)
  return ok(action)
})

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'action', 'update')
  const body = await readBody(req)
  const input = updateActionSchema.parse(body)
  const db = getDatabase()

  const updateData: Record<string, any> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description
  if (input.status !== undefined) {
    updateData.status = input.status
    if (input.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.completion_note = input.completionNote || null
    }
  }
  if (input.priority !== undefined) updateData.priority = input.priority
  if (input.assigneeId !== undefined) updateData.assignee_id = input.assigneeId
  if (input.dueAt !== undefined) updateData.due_at = input.dueAt

  await db.updateTable('actions').set(updateData)
    .where('id', '=', params.id).where('tenant_id', '=', auth.tenantId).execute()

  const result = await db.selectFrom('actions').selectAll().where('id', '=', params.id).executeTakeFirst()
  return ok(result)
})
