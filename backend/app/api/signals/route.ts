// GET /api/signals — 列表
// PATCH handled in [id]/route.ts
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, parsePagination, parseQuery } from '@/shared/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'signal', 'read')
  const { page, pageSize, sortOrder } = parsePagination(req.url)
  const query = parseQuery(req.url)
  const db = getDatabase()
  const offset = (page - 1) * pageSize

  let q = db.selectFrom('signals').selectAll().where('tenant_id', '=', auth.tenantId)
  if (query.type) q = q.where('type', '=', query.type as any)
  if (query.severity) q = q.where('severity', '=', query.severity as any)
  if (query.status) q = q.where('status', '=', query.status as any)

  const items = await q.orderBy('detected_at', sortOrder).limit(pageSize).offset(offset).execute()
  return ok({ items, page, pageSize })
})
