// ==================== 证据 (Evidence) ====================

export type EvidenceSourceCategory = 'internal' | 'external'

export type EvidenceSourceType =
  | 'survey'
  | 'interview'
  | 'internal_data'
  | 'historical'
  | 'social'
  | 'competitor'
  | 'report'
  | 'news'
  | 'manual'

export interface ConfidenceFactors {
  sourceReliability: number
  dataFreshness: number
  sampleSize?: number
  methodology?: string
}

export interface Evidence {
  id: string
  tenantId: string
  sourceCategory: EvidenceSourceCategory
  sourceType: EvidenceSourceType
  sourceLabel: string
  sourceRef: string
  content: string
  summary: string
  tags: string[]
  confidence: number
  confidenceFactors?: ConfidenceFactors
  freshnessAt: string
  citation: string
  attachmentUrls?: string[]
  importJobId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 议题-证据关联表（含立场分析）
export interface IssueEvidence {
  issueId: string
  evidenceId: string
  relationType: 'auto' | 'manual'
  relevanceScore: number
  stance: 'pro' | 'con' | 'neutral'
  stanceSource: 'ai' | 'manual'
  stanceConfidence: number
  stanceReason: string
  stanceVersion: number
  stanceAnalyzedAt: string
  createdAt: string
  updatedAt: string
}
