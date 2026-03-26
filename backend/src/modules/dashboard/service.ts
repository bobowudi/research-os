// ==================== 仪表盘服务 ====================

import { getDatabase } from '@research-os/database'
import type { AuthContext } from '@research-os/shared'

export const dashboardService = {
  /** 获取仪表盘概览数据 */
  async getOverview(auth: AuthContext) {
    const db = getDatabase()
    const { tenantId, userId } = auth

    // 并行查询各项统计
    const [
      issueStats,
      decisionStats,
      actionStats,
      signalStats,
      insightStats,
      evidenceCount,
    ] = await Promise.all([
      // 活跃议题数
      db.selectFrom('issues')
        .select(db.fn.count<number>('id').as('count'))
        .where('tenant_id', '=', tenantId)
        .where('status', 'not in', ['closed', 'decided'])
        .executeTakeFirstOrThrow(),

      // 待决策数
      db.selectFrom('decision_cards')
        .select(db.fn.count<number>('id').as('count'))
        .where('tenant_id', '=', tenantId)
        .where('status', '=', 'pending_review')
        .executeTakeFirstOrThrow(),

      // 行动项统计
      db.selectFrom('actions')
        .select([
          db.fn.count<number>('id').as('total'),
        ])
        .where('tenant_id', '=', tenantId)
        .where('status', 'in', ['pending', 'in_progress', 'overdue'])
        .executeTakeFirstOrThrow(),

      // 逾期行动项
      db.selectFrom('actions')
        .select(db.fn.count<number>('id').as('count'))
        .where('tenant_id', '=', tenantId)
        .where('status', '=', 'overdue')
        .executeTakeFirstOrThrow(),

      // 近期洞察（7天内）
      db.selectFrom('insights')
        .select(db.fn.count<number>('id').as('count'))
        .where('tenant_id', '=', tenantId)
        .executeTakeFirstOrThrow(),

      // 证据总量
      db.selectFrom('evidence')
        .select(db.fn.count<number>('id').as('count'))
        .where('tenant_id', '=', tenantId)
        .executeTakeFirstOrThrow(),
    ])

    // 紧急决策列表（pending_review，按时间排序）
    const urgentDecisions = await db
      .selectFrom('decision_cards')
      .select(['id', 'issue_id', 'recommendation', 'confidence', 'status', 'created_at'])
      .where('tenant_id', '=', tenantId)
      .where('status', '=', 'pending_review')
      .orderBy('created_at', 'asc')
      .limit(5)
      .execute()

    // 我的工作项
    const myIssues = await db
      .selectFrom('issues')
      .select(['id', 'title', 'status', 'decision_due_at'])
      .where('tenant_id', '=', tenantId)
      .where('owner_id', '=', userId)
      .where('status', 'not in', ['closed'])
      .orderBy('decision_due_at', 'asc')
      .limit(10)
      .execute()

    const myActions = await db
      .selectFrom('actions')
      .select(['id', 'title', 'status', 'priority', 'due_at'])
      .where('tenant_id', '=', tenantId)
      .where('assignee_id', '=', userId)
      .where('status', 'in', ['pending', 'in_progress', 'overdue'])
      .orderBy('due_at', 'asc')
      .limit(10)
      .execute()

    return {
      overview: {
        activeIssues: Number(issueStats.count),
        pendingDecisions: Number(decisionStats.count),
        openActions: Number(actionStats.total),
        overdueActions: Number(signalStats.count),
        activeSignals: 0, // TODO
        recentInsights: Number(insightStats.count),
        evidenceTotal: Number(evidenceCount.count),
        dataSourceHealth: { healthy: 0, warning: 0, error: 0 }, // TODO
      },
      urgentDecisions: urgentDecisions.map((d) => ({
        id: d.id,
        issueId: d.issue_id,
        recommendation: d.recommendation,
        confidence: d.confidence,
        status: d.status,
        createdAt: d.created_at,
      })),
      actionProgress: {
        completed: 0, // TODO
        inProgress: 0,
        pending: 0,
        overdue: Number(signalStats.count),
      },
      recentInsights: [],
      recentSignals: [],
      myWorkItems: {
        ownedIssues: myIssues.map((i) => ({
          id: i.id,
          title: i.title,
          status: i.status,
          decisionDueAt: i.decision_due_at,
        })),
        assignedActions: myActions.map((a) => ({
          id: a.id,
          title: a.title,
          status: a.status,
          priority: a.priority,
          dueAt: a.due_at,
        })),
        pendingReviews: [],
      },
    }
  },
}
