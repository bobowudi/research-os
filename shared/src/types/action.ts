// ==================== 行动项 (Action) ====================

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Action {
  id: string
  tenantId: string
  issueId: string
  decisionCardId: string
  parentActionId?: string
  title: string
  description: string
  status: ActionStatus
  priority: ActionPriority
  assigneeId?: string
  assigneeName?: string
  dueAt?: string
  completedAt?: string
  completionNote?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}
