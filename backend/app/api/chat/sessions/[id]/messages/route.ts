// GET /api/chat/sessions/:id/messages — 消息列表
// POST /api/chat/sessions/:id/messages — 发送消息
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth } from '@/middleware/auth'
import { withErrorHandler, NotFoundError } from '@/middleware/error-handler'
import { ok, created, readBody, generateId } from '@/shared/response'
import { sendChatMessageSchema } from '@research-os/shared/src/validators/entities'
import { callLLM } from '@/modules/ai/llm/client'

interface Params { params: { id: string } }

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  const db = getDatabase()

  const session = await db.selectFrom('chat_sessions').selectAll()
    .where('id', '=', params.id).where('user_id', '=', auth.userId).executeTakeFirst()
  if (!session) throw new NotFoundError('ChatSession', params.id)

  const messages = await db.selectFrom('chat_messages').selectAll()
    .where('session_id', '=', params.id)
    .orderBy('created_at', 'asc')
    .execute()

  return ok(messages)
})

export const POST = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  const body = await readBody(req)
  const input = sendChatMessageSchema.parse(body)
  const db = getDatabase()

  // 保存用户消息
  const userMsgId = generateId()
  await db.insertInto('chat_messages').values({
    id: userMsgId,
    session_id: params.id,
    role: 'user',
    content: input.content,
  }).execute()

  // 获取历史消息作为上下文
  const history = await db.selectFrom('chat_messages').selectAll()
    .where('session_id', '=', params.id)
    .orderBy('created_at', 'asc')
    .execute()

  // 调用 LLM
  const llmMessages = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  })).filter((m) => m.role === 'user' || m.role === 'assistant')

  const aiResponse = await callLLM({
    system: '你是 ResearchOS 的 AI 研究助手。帮助用户分析议题、解读证据、生成洞察。回答要专业、简洁、有理据。',
    messages: llmMessages,
  })

  // 保存 AI 回复
  const aiMsgId = generateId()
  await db.insertInto('chat_messages').values({
    id: aiMsgId,
    session_id: params.id,
    role: 'assistant',
    content: aiResponse.text,
  }).execute()

  // 更新会话时间
  await db.updateTable('chat_sessions')
    .set({ updated_at: new Date().toISOString() })
    .where('id', '=', params.id).execute()

  return created({
    userMessage: { id: userMsgId, role: 'user', content: input.content },
    assistantMessage: { id: aiMsgId, role: 'assistant', content: aiResponse.text },
  })
})
