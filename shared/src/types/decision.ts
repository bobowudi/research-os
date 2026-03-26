// ==================== 决策卡 (DecisionCard) ====================

export type DecisionCardStatus = 'draft' | 'pending_review' | 'adopted' | 'rejected' | 'superseded'

export interface RiskItem {
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: number
  evidenceIds: string[]
}

export interface DecisionCard {
  id: string
  tenantId: string
  issueId: string
  reasoningRunId: string
  version: number
  recommendation: string
  confidence: number
  keyFactors: string[]
  risks: RiskItem[]
  dissent: string
  suggestedActions: string[]
  evidenceSummary: {
    proCount: number
    conCount: number
    neutralCount: number
    totalEvidenceUsed: number
  }
  status: DecisionCardStatus
  adoptedBy?: string
  adoptedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  decisionNote?: string
  shareToken?: string
  shareExpiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface DecisionVote {
  id: string
  decisionCardId: string
  userId: string
  userName: string
  vote: 'approve' | 'reject' | 'abstain'
  comment?: string
  createdAt: string
}
