// ==================== Kysely 数据表类型定义 ====================
// 与 shared/src/types 保持一致，此处为数据库行类型

import type { Generated, ColumnType } from 'kysely'

// ====== 租户 ======
export interface TenantTable {
  id: Generated<string>
  name: string
  slug: string
  industry: string | null
  team_size: string | null
  plan: 'free' | 'pro' | 'enterprise'
  settings: string // JSON
  owner_id: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 用户 ======
export interface UserTable {
  id: Generated<string>
  tenant_id: string
  email: string
  name: string
  password_hash: string
  role: 'admin' | 'analyst' | 'viewer'
  avatar_url: string | null
  status: 'active' | 'disabled'
  last_login_at: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 刷新令牌 ======
export interface RefreshTokenTable {
  id: Generated<string>
  user_id: string
  token_hash: string
  device_info: string | null
  ip_address: string | null
  expires_at: string
  revoked_at: string | null
  created_at: Generated<string>
}

// ====== 密码历史 ======
export interface PasswordHistoryTable {
  id: Generated<string>
  user_id: string
  password_hash: string
  created_at: Generated<string>
}

// ====== 邀请 ======
export interface InvitationTable {
  id: Generated<string>
  tenant_id: string
  email: string
  role: 'analyst' | 'viewer'
  invite_token: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  invited_by: string
  accepted_by: string | null
  expires_at: string
  accepted_at: string | null
  cancelled_at: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 议题 ======
export interface IssueTable {
  id: Generated<string>
  tenant_id: string
  title: string
  description: string
  domain: 'brand' | 'product' | 'market' | 'strategy' | 'operations'
  status: 'draft' | 'collecting' | 'analyzing' | 'pending_decision' | 'decided' | 'closed'
  owner_id: string
  owner_name: string
  tags: string // JSON array
  decision_due_at: string
  evidence_count: Generated<number>
  insight_count: Generated<number>
  decision_card_count: Generated<number>
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 证据 ======
export interface EvidenceTable {
  id: Generated<string>
  tenant_id: string
  source_category: 'internal' | 'external'
  source_type: 'survey' | 'interview' | 'internal_data' | 'historical' | 'social' | 'competitor' | 'report' | 'news' | 'manual'
  source_label: string
  source_ref: string
  content: string
  summary: string
  tags: string // JSON array
  confidence: number
  confidence_factors: string | null // JSON
  freshness_at: string
  citation: string
  attachment_urls: string | null // JSON array
  import_job_id: string | null
  created_by: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 议题-证据关联（含立场） ======
export interface IssueEvidenceTable {
  issue_id: string
  evidence_id: string
  relation_type: 'auto' | 'manual'
  relevance_score: number
  stance: 'pro' | 'con' | 'neutral'
  stance_source: 'ai' | 'manual'
  stance_confidence: number
  stance_reason: string
  stance_version: Generated<number>
  stance_analyzed_at: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 洞察 ======
export interface InsightTable {
  id: Generated<string>
  tenant_id: string
  issue_id: string
  title: string
  description: string
  type: 'finding' | 'risk' | 'opportunity' | 'contradiction'
  status: 'draft' | 'confirmed' | 'disputed' | 'archived'
  source: 'ai_reasoning' | 'ai_signal' | 'manual'
  direction: 'pro' | 'con' | 'neutral'
  confidence: number
  score: number
  reasoning_run_id: string | null
  created_by: string
  confirmed_by: string | null
  confirmed_at: string | null
  disputed_by: string | null
  disputed_at: string | null
  dispute_reason: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 洞察-证据关联 ======
export interface InsightEvidenceTable {
  insight_id: string
  evidence_id: string
  support_type: 'supports' | 'contradicts' | 'contextual'
  note: string | null
  created_at: Generated<string>
}

// ====== 推理运行 ======
export interface ReasoningRunTable {
  id: Generated<string>
  tenant_id: string
  issue_id: string
  run_type: 'full' | 'incremental' | 'targeted'
  status: 'pending' | 'running' | 'completed' | 'failed'
  config: string | null // JSON
  internal_analysis: string | null // JSON
  external_analysis: string | null // JSON
  synthesis: string | null // JSON
  evidence_used_count: number
  insight_generated_count: number
  total_tokens: number
  duration_ms: number
  error_log: string | null
  triggered_by: string
  started_at: string | null
  completed_at: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 决策卡 ======
export interface DecisionCardTable {
  id: Generated<string>
  tenant_id: string
  issue_id: string
  reasoning_run_id: string
  version: Generated<number>
  recommendation: string
  confidence: number
  key_factors: string // JSON array
  risks: string // JSON array of RiskItem
  dissent: string
  suggested_actions: string // JSON array
  evidence_summary: string // JSON { proCount, conCount, neutralCount, totalEvidenceUsed }
  status: 'draft' | 'pending_review' | 'adopted' | 'rejected' | 'superseded'
  adopted_by: string | null
  adopted_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  decision_note: string | null
  share_token: string | null
  share_expires_at: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 决策投票 ======
export interface DecisionVoteTable {
  id: Generated<string>
  decision_card_id: string
  user_id: string
  user_name: string
  vote: 'approve' | 'reject' | 'abstain'
  comment: string | null
  created_at: Generated<string>
}

// ====== 行动项 ======
export interface ActionTable {
  id: Generated<string>
  tenant_id: string
  issue_id: string
  decision_card_id: string
  parent_action_id: string | null
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id: string | null
  assignee_name: string | null
  due_at: string | null
  completed_at: string | null
  completion_note: string | null
  created_by: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 回看 ======
export interface ReviewTable {
  id: Generated<string>
  tenant_id: string
  issue_id: string
  decision_card_id: string
  action_id: string | null
  outcome: 'successful' | 'partially_successful' | 'unsuccessful' | 'inconclusive'
  actual_result: string
  expected_result: string
  deviation: string
  lessons_learned: string
  tags: string // JSON array
  generated_evidence_id: string | null
  reviewed_by: string
  reviewed_at: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 信号 ======
export interface SignalTable {
  id: Generated<string>
  tenant_id: string
  type: 'risk' | 'opportunity' | 'trend' | 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'detected' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed'
  title: string
  description: string
  evidence_ids: string // JSON array
  related_issue_ids: string // JSON array
  generated_insight_id: string | null
  detected_at: string
  acknowledged_by: string | null
  acknowledged_at: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 数据源 ======
export interface DataSourceTable {
  id: Generated<string>
  tenant_id: string
  name: string
  type: 'web_crawler' | 'rss_feed' | 'api_integration' | 'file_watch'
  status: 'active' | 'paused' | 'error' | 'disabled'
  config: string // JSON
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'
  sync_cron_expression: string | null
  target_source_category: 'internal' | 'external'
  target_source_type: string
  field_mapping: string | null // JSON
  deduplication_key: string | null
  last_sync_at: string | null
  last_sync_status: 'success' | 'partial' | 'failed' | null
  total_imported: Generated<number>
  error_count: Generated<number>
  created_by: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 导入任务 ======
export interface ImportJobTable {
  id: Generated<string>
  tenant_id: string
  data_source_id: string
  status: 'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled'
  total_items: Generated<number>
  processed_items: Generated<number>
  imported_items: Generated<number>
  skipped_items: Generated<number>
  failed_items: Generated<number>
  error_log: string | null // JSON array
  imported_evidence_ids: string // JSON array
  started_at: string | null
  completed_at: string | null
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 聊天会话 ======
export interface ChatSessionTable {
  id: Generated<string>
  tenant_id: string
  user_id: string
  issue_id: string | null
  title: string
  created_at: Generated<string>
  updated_at: Generated<string>
}

// ====== 聊天消息 ======
export interface ChatMessageTable {
  id: Generated<string>
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  references: string | null // JSON
  created_at: Generated<string>
}

// ====== 审计日志 ======
export interface AuditLogTable {
  id: Generated<string>
  tenant_id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  details: string | null // JSON
  ip_address: string | null
  user_agent: string | null
  created_at: Generated<string>
}

// ==================== 总数据库类型 ====================

export interface Database {
  tenants: TenantTable
  users: UserTable
  refresh_tokens: RefreshTokenTable
  password_history: PasswordHistoryTable
  invitations: InvitationTable
  issues: IssueTable
  evidence: EvidenceTable
  issue_evidence: IssueEvidenceTable
  insights: InsightTable
  insight_evidence: InsightEvidenceTable
  reasoning_runs: ReasoningRunTable
  decision_cards: DecisionCardTable
  decision_votes: DecisionVoteTable
  actions: ActionTable
  reviews: ReviewTable
  signals: SignalTable
  data_sources: DataSourceTable
  import_jobs: ImportJobTable
  chat_sessions: ChatSessionTable
  chat_messages: ChatMessageTable
  audit_logs: AuditLogTable
}
