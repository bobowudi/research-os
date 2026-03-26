// ==================== 回看 (Review) ====================

export type ReviewOutcome = 'successful' | 'partially_successful' | 'unsuccessful' | 'inconclusive'

export interface Review {
  id: string
  tenantId: string
  issueId: string
  decisionCardId: string
  actionId?: string
  outcome: ReviewOutcome
  actualResult: string
  expectedResult: string
  deviation: string
  lessonsLearned: string
  tags: string[]
  generatedEvidenceId?: string
  reviewedBy: string
  reviewedAt: string
  createdAt: string
  updatedAt: string
}
