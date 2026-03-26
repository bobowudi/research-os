// ==================== AI 聊天 (Chat) ====================

export interface ChatSession {
  id: string
  tenantId: string
  userId: string
  issueId?: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  references?: {
    evidenceIds?: string[]
    insightIds?: string[]
    decisionCardIds?: string[]
  }
  createdAt: string
}
