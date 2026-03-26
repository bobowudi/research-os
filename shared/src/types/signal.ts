// ==================== 信号 (Signal) ====================

export type SignalType = 'risk' | 'opportunity' | 'trend' | 'anomaly'
export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical'
export type SignalStatus = 'detected' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed'

export interface Signal {
  id: string
  tenantId: string
  type: SignalType
  severity: SignalSeverity
  status: SignalStatus
  title: string
  description: string
  evidenceIds: string[]
  relatedIssueIds: string[]
  generatedInsightId?: string
  detectedAt: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
  updatedAt: string
}
