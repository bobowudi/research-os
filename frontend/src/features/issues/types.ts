import type { Component } from 'vue'

export type IssueStatus =
  | 'draft'
  | 'collecting'
  | 'analyzing'
  | 'pending_decision'
  | 'decided'
  | 'closed'

export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export interface IssueUser {
  username?: string
}

export interface IssueTenant {
  name?: string
}

export interface IssueDetail {
  id: string
  title: string
  description?: string
  status: IssueStatus | string
  domain?: string
  priority?: IssuePriority | string
  createdAt: string
  decisionDueAt?: string
  assignee?: IssueUser | null
  tenant?: IssueTenant | null
  evidenceCount?: number
  insightCount?: number
  decisionCardCount?: number
}

export interface IssueStatusOption {
  value: string
  label: string
}

export interface IssueStatCard {
  label: string
  value: string | number
  icon: Component
  type?: 'primary' | 'success' | 'warning' | 'info'
  trend?: string | number
  trendType?: 'up' | 'down'
}
