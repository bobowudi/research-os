// POST /api/decisions/:id/vote
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { created, readBody, generateId } from '@/shared/response'
import { voteDecisionSchema } from '@research-os/shared/src/validators/entities'

interface Params { params: { id: string } }

export const POST = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'decision', 'update')
  const body = await readBody(req)
  const input = voteDecisionSchema.parse(body)
  const db = getDatabase()

  const user = await db.selectFrom('users').select(['name']).where('id', '=', auth.userId).executeTakeFirstOrThrow()

  await db.insertInto('decision_votes').values({
    id: generateId(),
    decision_card_id: params.id,
    user_id: auth.userId,
    user_name: user.name,
    vote: input.vote,
    comment: input.comment || null,
  }).execute()

  return created({ decisionCardId: params.id, vote: input.vote })
})
