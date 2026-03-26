// ==================== Zod 验证器 — 业务实体 ====================

import { z } from 'zod'
import { PAGINATION } from '../constants/business'

// ====== 分页 ======
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ====== 议题 ======
export const createIssueSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200),
  description: z.string().min(1, '描述不能为空'),
  domain: z.enum(['brand', 'product', 'market', 'strategy', 'operations']),
  tags: z.array(z.string()).default([]),
  decisionDueAt: z.string().datetime(),
})

export const updateIssueSchema = createIssueSchema.partial().extend({
  status: z.enum(['draft', 'collecting', 'analyzing', 'pending_decision', 'decided', 'closed']).optional(),
})

// ====== 证据 ======
export const createEvidenceSchema = z.object({
  sourceCategory: z.enum(['internal', 'external']),
  sourceType: z.enum(['survey', 'interview', 'internal_data', 'historical', 'social', 'competitor', 'report', 'news', 'manual']),
  sourceLabel: z.string().min(1).max(200),
  sourceRef: z.string().max(500).default(''),
  content: z.string().min(1),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  confidenceFactors: z.object({
    sourceReliability: z.number().min(0).max(1),
    dataFreshness: z.number().min(0).max(1),
    sampleSize: z.number().optional(),
    methodology: z.string().optional(),
  }).optional(),
  freshnessAt: z.string().datetime(),
  citation: z.string().max(500),
  attachmentUrls: z.array(z.string().url()).optional(),
})

// ====== 议题-证据关联 ======
export const linkEvidenceSchema = z.object({
  evidenceId: z.string().uuid(),
  relationType: z.enum(['auto', 'manual']).default('manual'),
  relevanceScore: z.number().min(0).max(1).default(0.5),
})

// ====== 洞察 ======
export const createInsightSchema = z.object({
  issueId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(['finding', 'risk', 'opportunity', 'contradiction']),
  direction: z.enum(['pro', 'con', 'neutral']),
  confidence: z.number().min(0).max(1),
  score: z.number(),
  evidenceIds: z.array(z.string().uuid()).min(1, '至少关联一条证据'),
})

// ====== 决策卡操作 ======
export const voteDecisionSchema = z.object({
  vote: z.enum(['approve', 'reject', 'abstain']),
  comment: z.string().max(2000).optional(),
})

export const adoptDecisionSchema = z.object({
  decisionNote: z.string().max(2000).optional(),
})

// ====== 行动项 ======
export const createActionSchema = z.object({
  issueId: z.string().uuid(),
  decisionCardId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
  parentActionId: z.string().uuid().optional(),
})

export const updateActionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  completionNote: z.string().max(2000).optional(),
})

// ====== 回看 ======
export const createReviewSchema = z.object({
  issueId: z.string().uuid(),
  decisionCardId: z.string().uuid(),
  actionId: z.string().uuid().optional(),
  outcome: z.enum(['successful', 'partially_successful', 'unsuccessful', 'inconclusive']),
  actualResult: z.string().min(1),
  expectedResult: z.string().min(1),
  deviation: z.string(),
  lessonsLearned: z.string().min(1),
  tags: z.array(z.string()).default([]),
})

// ====== 信号 ======
export const updateSignalSchema = z.object({
  status: z.enum(['detected', 'acknowledged', 'investigating', 'resolved', 'dismissed']).optional(),
})

// ====== 数据源 ======
export const createDataSourceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['web_crawler', 'rss_feed', 'api_integration', 'file_watch']),
  syncFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual']).default('daily'),
  targetSourceCategory: z.enum(['internal', 'external']),
  targetSourceType: z.string().min(1),
  config: z.record(z.unknown()),
  fieldMapping: z.record(z.string()).optional(),
  deduplicationKey: z.string().optional(),
})

// ====== 聊天 ======
export const createChatSessionSchema = z.object({
  title: z.string().min(1).max(200),
  issueId: z.string().uuid().optional(),
})

export const sendChatMessageSchema = z.object({
  content: z.string().min(1).max(10000),
})

// ====== 推理运行 ======
export const triggerReasoningSchema = z.object({
  issueId: z.string().uuid(),
  runType: z.enum(['full', 'incremental', 'targeted']).default('full'),
  config: z.record(z.unknown()).optional(),
})

// ====== 类型导出 ======
export type CreateIssueInput = z.infer<typeof createIssueSchema>
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>
export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>
export type LinkEvidenceInput = z.infer<typeof linkEvidenceSchema>
export type CreateInsightInput = z.infer<typeof createInsightSchema>
export type VoteDecisionInput = z.infer<typeof voteDecisionSchema>
export type CreateActionInput = z.infer<typeof createActionSchema>
export type UpdateActionInput = z.infer<typeof updateActionSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>
export type TriggerReasoningInput = z.infer<typeof triggerReasoningSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
