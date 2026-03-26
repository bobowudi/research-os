// ==================== 议题 (Issue) ====================

export type IssueStatus =
  | 'draft'
  | 'collecting'
  | 'analyzing'
  | 'pending_decision'
  | 'decided'
  | 'closed'

export interface Issue {
  id: string
  tenantId: string
  title: string
  description: string
  domain: 'brand' | 'product' | 'market' | 'strategy' | 'operations'
  status: IssueStatus
  ownerId: string
  ownerName: string
  tags: string[]
  decisionDueAt: string
  evidenceCount: number
  insightCount: number
  decisionCardCount: number
  createdAt: string
  updatedAt: string
}
