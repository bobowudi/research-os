import type { IssueStatus } from './types'

export const ISSUE_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['collecting'],
  collecting: ['analyzing', 'closed'],
  analyzing: ['pending_decision', 'collecting', 'closed'],
  pending_decision: ['decided', 'analyzing'],
  decided: ['closed'],
  closed: ['collecting'],
}

export const ISSUE_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  collecting: '收集中',
  analyzing: '分析中',
  pending_decision: '待决策',
  decided: '已决策',
  closed: '已关闭',
}

export const ISSUE_PRIORITY_LABELS: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
  none: '无',
}

export const ISSUE_DOMAIN_OPTIONS = [
  { label: '品牌', value: 'brand' },
  { label: '产品', value: 'product' },
  { label: '市场', value: 'market' },
  { label: '战略', value: 'strategy' },
  { label: '运营', value: 'operations' },
]

export const ISSUE_PRIORITY_OPTIONS = [
  { label: '紧急', value: 'urgent' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

export const ISSUE_STATUS_TABS = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '收集中', value: 'collecting' },
  { label: '分析中', value: 'analyzing' },
  { label: '待决策', value: 'pending_decision' },
  { label: '已决策', value: 'decided' },
  { label: '已关闭', value: 'closed' },
]

export const ISSUE_STATUS_TYPE_MAP: Record<string, string> = {
  draft: 'info',
  collecting: 'primary',
  analyzing: 'warning',
  pending_decision: 'danger',
  decided: 'success',
  closed: 'info',
}

export const ISSUE_ACTIVE_TABS = ['description', 'evidence', 'insights', 'decisions'] as const

export type IssueDetailTab = (typeof ISSUE_ACTIVE_TABS)[number]
export type KnownIssueStatus = IssueStatus
