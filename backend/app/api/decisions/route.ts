// GET /api/decisions — 列表
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, parsePagination, parseQuery } from '@/shared/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'decision', 'read')
  const { page, pageSize, sortOrder } = parsePagination(req.url)
  const query = parseQuery(req.url)
  const db = getDatabase()
  const offset = (page - 1) * pageSize

  let q = db.selectFrom('decision_cards').selectAll().where('tenant_id', '=', auth.tenantId)
  if (query.issueId) q = q.where('issue_id', '=', query.issueId)
  if (query.status) q = q.where('status', '=', query.status as any)

  const items = await q.orderBy('created_at', sortOrder).limit(pageSize).offset(offset).execute()
  return ok({ items, page, pageSize })
})
