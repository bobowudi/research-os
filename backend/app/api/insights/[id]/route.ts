// GET /api/insights/:id
// PATCH /api/insights/:id
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler, NotFoundError } from '@/middleware/error-handler'
import { ok, readBody } from '@/shared/response'

interface Params { params: { id: string } }

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'insight', 'read')
  const db = getDatabase()
  const insight = await db.selectFrom('insights').selectAll()
    .where('id', '=', params.id).where('tenant_id', '=', auth.tenantId).executeTakeFirst()
  if (!insight) throw new NotFoundError('Insight', params.id)
  return ok(insight)
})

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'insight', 'update')
  const body = await readBody<Record<string, any>>(req)
  const db = getDatabase()

  const updateData: Record<string, any> = {}
  if (body.status) updateData.status = body.status
  if (body.status === 'confirmed') {
    updateData.confirmed_by = auth.userId
    updateData.confirmed_at = new Date().toISOString()
  }
  if (body.status === 'disputed') {
    updateData.disputed_by = auth.userId
    updateData.disputed_at = new Date().toISOString()
    updateData.dispute_reason = body.disputeReason || ''
  }

  await db.updateTable('insights').set(updateData)
    .where('id', '=', params.id).where('tenant_id', '=', auth.tenantId).execute()

  const result = await db.selectFrom('insights').selectAll().where('id', '=', params.id).executeTakeFirst()
  return ok(result)
})
