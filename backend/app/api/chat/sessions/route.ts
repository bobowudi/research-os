// GET /api/chat/sessions — 列表
// POST /api/chat/sessions — 创建
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, created, readBody, generateId } from '@/shared/response'
import { createChatSessionSchema } from '@research-os/shared/src/validators/entities'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const db = getDatabase()

  const sessions = await db.selectFrom('chat_sessions').selectAll()
    .where('tenant_id', '=', auth.tenantId)
    .where('user_id', '=', auth.userId)
    .orderBy('updated_at', 'desc')
    .limit(50)
    .execute()

  return ok(sessions)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const body = await readBody(req)
  const input = createChatSessionSchema.parse(body)
  const db = getDatabase()
  const id = generateId()

  await db.insertInto('chat_sessions').values({
    id,
    tenant_id: auth.tenantId,
    user_id: auth.userId,
    issue_id: input.issueId || null,
    title: input.title,
  }).execute()

  const result = await db.selectFrom('chat_sessions').selectAll().where('id', '=', id).executeTakeFirst()
  return created(result)
})
