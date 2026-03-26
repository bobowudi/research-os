// ==================== 洞察 (Insight) ====================

export type InsightStatus = 'draft' | 'confirmed' | 'disputed' | 'archived'
export type InsightType = 'finding' | 'risk' | 'opportunity' | 'contradiction'
export type InsightSource = 'ai_reasoning' | 'ai_signal' | 'manual'

export interface Insight {
  id: string
  tenantId: string
  issueId: string
  title: string
  description: string
  type: InsightType
  status: InsightStatus
  source: InsightSource
  direction: 'pro' | 'con' | 'neutral'
  confidence: number
  score: number
  reasoningRunId?: string
  createdBy: string
  confirmedBy?: string
  confirmedAt?: string
  disputedBy?: string
  disputedAt?: string
  disputeReason?: string
  createdAt: string
  updatedAt: string
}

// 洞察-证据关联表
export interface InsightEvidence {
  insightId: string
  evidenceId: string
  supportType: 'supports' | 'contradicts' | 'contextual'
  note?: string
  createdAt: string
}
