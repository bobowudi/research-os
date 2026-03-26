// ==================== 仪表盘 (Dashboard) ====================

import type { DecisionCardStatus } from './decision'
import type { SignalType, SignalSeverity } from './signal'
import type { InsightType, InsightStatus } from './insight'
import type { IssueStatus } from './issue'
import type { ActionStatus, ActionPriority } from './action'

export interface DashboardData {
  overview: {
    activeIssues: number
    pendingDecisions: number
    openActions: number
    overdueActions: number
    activeSignals: number
    recentInsights: number
    evidenceTotal: number
    dataSourceHealth: {
      healthy: number
      warning: number
      error: number
    }
  }
  urgentDecisions: DecisionCardSummary[]
  recentSignals: SignalSummary[]
  actionProgress: {
    completed: number
    inProgress: number
    pending: number
    overdue: number
  }
  recentInsights: InsightSummary[]
  myWorkItems: {
    ownedIssues: IssueSummary[]
    assignedActions: ActionSummary[]
    pendingReviews: DecisionCardSummary[]
  }
}

export interface DecisionCardSummary {
  id: string
  issueId: string
  recommendation: string
  confidence: number
  status: DecisionCardStatus
  createdAt: string
}

export interface SignalSummary {
  id: string
  type: SignalType
  severity: SignalSeverity
  title: string
  detectedAt: string
}

export interface InsightSummary {
  id: string
  issueId: string
  title: string
  type: InsightType
  status: InsightStatus
  confidence: number
  createdAt: string
}

export interface IssueSummary {
  id: string
  title: string
  status: IssueStatus
  decisionDueAt: string
}

export interface ActionSummary {
  id: string
  title: string
  status: ActionStatus
  priority: ActionPriority
  dueAt?: string
}
