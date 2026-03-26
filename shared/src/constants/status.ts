// ==================== 状态机定义 ====================
// 各实体的合法状态流转

import type { IssueStatus } from '../types/issue'
import type { DecisionCardStatus } from '../types/decision'
import type { ActionStatus } from '../types/action'
import type { SignalStatus } from '../types/signal'
import type { InsightStatus } from '../types/insight'
import type { ImportJobStatus } from '../types/data-source'

/** 议题状态流转 */
export const ISSUE_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  draft: ['collecting'],
  collecting: ['analyzing', 'closed'],
  analyzing: ['pending_decision', 'collecting', 'closed'],
  pending_decision: ['decided', 'analyzing'],
  decided: ['closed'],
  closed: ['collecting'], // 可重新激活
}

/** 决策卡状态流转 */
export const DECISION_CARD_TRANSITIONS: Record<DecisionCardStatus, DecisionCardStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['adopted', 'rejected'],
  adopted: ['superseded'],
  rejected: [],
  superseded: [],
}

/** 行动项状态流转 */
export const ACTION_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled', 'overdue'],
  completed: [],
  cancelled: [],
  overdue: ['in_progress', 'completed', 'cancelled'],
}

/** 信号状态流转 */
export const SIGNAL_TRANSITIONS: Record<SignalStatus, SignalStatus[]> = {
  detected: ['acknowledged', 'dismissed'],
  acknowledged: ['investigating', 'resolved', 'dismissed'],
  investigating: ['resolved', 'dismissed'],
  resolved: [],
  dismissed: [],
}

/** 洞察状态流转 */
export const INSIGHT_TRANSITIONS: Record<InsightStatus, InsightStatus[]> = {
  draft: ['confirmed', 'disputed', 'archived'],
  confirmed: ['archived'],
  disputed: ['confirmed', 'archived'],
  archived: [],
}

/** 导入任务状态流转 */
export const IMPORT_JOB_TRANSITIONS: Record<ImportJobStatus, ImportJobStatus[]> = {
  pending: ['running', 'cancelled'],
  running: ['completed', 'partial', 'failed'],
  completed: [],
  partial: [],
  failed: [],
  cancelled: [],
}

/** 通用状态检查：是否允许从 A → B 流转 */
export function canTransition<T extends string>(
  transitions: Record<T, T[]>,
  from: T,
  to: T,
): boolean {
  return transitions[from]?.includes(to) ?? false
}
