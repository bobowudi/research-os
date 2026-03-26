// GET /api/signals/:id
// PATCH /api/signals/:id
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler, NotFoundError } from '@/middleware/error-handler'
import { ok, readBody } from '@/shared/response'

interface Params { params: { id: string } }

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'signal', 'read')
  const db = getDatabase()
  const signal = await db.selectFrom('signals').selectAll()
    .where('id', '=', params.id).where('tenant_id', '=', auth.tenantId).executeTakeFirst()
  if (!signal) throw new NotFoundError('Signal', params.id)
  return ok(signal)
})

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'signal', 'update')
  const body = await readBody<Record<string, any>>(req)
  const db = getDatabase()

  const updateData: Record<string, any> = {}
  if (body.status) {
    updateData.status = body.status
    if (body.status === 'acknowledged') {
      updateData.acknowledged_by = auth.userId
      updateData.acknowledged_at = new Date().toISOString()
    }
  }

  await db.updateTable('signals').set(updateData)
    .where('id', '=', params.id).where('tenant_id', '=', auth.tenantId).execute()

  const result = await db.selectFrom('signals').selectAll().where('id', '=', params.id).executeTakeFirst()
  return ok(result)
})
