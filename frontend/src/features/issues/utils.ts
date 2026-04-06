import { Aim, Document, Opportunity } from '@element-plus/icons-vue'
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_TRANSITIONS,
  ISSUE_STATUS_TYPE_MAP,
} from './constants'
import type { IssueDetail, IssueStatCard, IssueStatusOption } from './types'

export function formatIssueDate(dateStr?: string) {
  if (!dateStr) return '-'

  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatIssueRelativeTime(dateStr?: string) {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 60) return `${minutes} 分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`

  return date.toLocaleDateString()
}

export function formatIssueStatus(status?: string) {
  return ISSUE_STATUS_LABELS[status ?? ''] || status || '-'
}

export function getIssueStatusType(status?: string) {
  return ISSUE_STATUS_TYPE_MAP[status ?? ''] || ''
}

export function formatIssuePriority(priority?: string) {
  return ISSUE_PRIORITY_LABELS[priority ?? ''] || '无'
}

export function getNextIssueStatuses(issue: IssueDetail | null): IssueStatusOption[] {
  if (!issue) return []

  const allowed = ISSUE_STATUS_TRANSITIONS[issue.status] || []
  return allowed.map((status) => ({
    value: status,
    label: ISSUE_STATUS_LABELS[status] || status,
  }))
}

export function buildIssueStatCards(issue: IssueDetail | null): IssueStatCard[] {
  return [
    {
      label: '关联证据',
      value: issue?.evidenceCount || 0,
      icon: Document,
      type: 'primary',
      trend: '+2',
      trendType: 'up',
    },
    {
      label: '深度洞察',
      value: issue?.insightCount || 0,
      icon: Opportunity,
      type: 'success',
    },
    {
      label: '决策建议',
      value: issue?.decisionCardCount || 0,
      icon: Aim,
      type: 'warning',
    },
  ]
}
