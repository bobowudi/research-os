// GET /api/decisions/:id
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler, NotFoundError } from '@/middleware/error-handler'
import { ok } from '@/shared/response'

interface Params { params: { id: string } }

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'decision', 'read')
  const db = getDatabase()

  const card = await db.selectFrom('decision_cards').selectAll()
    .where('id', '=', params.id).where('tenant_id', '=', auth.tenantId).executeTakeFirst()
  if (!card) throw new NotFoundError('DecisionCard', params.id)

  // 加载投票
  const votes = await db.selectFrom('decision_votes').selectAll()
    .where('decision_card_id', '=', params.id).execute()

  return ok({ ...card, votes })
})
