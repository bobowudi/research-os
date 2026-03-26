// ==================== 初始迁移：创建所有表 ====================
// 对齐 v3.1 产品文档 02-数据模型设计

import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // ====== 租户 ======
  await db.schema
    .createTable('tenants')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('slug', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('industry', 'varchar(50)')
    .addColumn('team_size', 'varchar(20)')
    .addColumn('plan', 'varchar(20)', (col) => col.notNull().defaultTo('free'))
    .addColumn('settings', 'json', (col) => col.notNull())
    .addColumn('owner_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 用户 ======
  await db.schema
    .createTable('users')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(20)', (col) => col.notNull().defaultTo('analyst'))
    .addColumn('avatar_url', 'varchar(500)')
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('active'))
    .addColumn('last_login_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_users_tenant_email').on('users').columns(['tenant_id', 'email']).unique().execute()

  // ====== 刷新令牌 ======
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('user_id', 'varchar(36)', (col) => col.notNull().references('users.id'))
    .addColumn('token_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('device_info', 'varchar(255)')
    .addColumn('ip_address', 'varchar(45)')
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('revoked_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_refresh_tokens_user').on('refresh_tokens').column('user_id').execute()

  // ====== 密码历史 ======
  await db.schema
    .createTable('password_history')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('user_id', 'varchar(36)', (col) => col.notNull().references('users.id'))
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  // ====== 邀请 ======
  await db.schema
    .createTable('invitations')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(20)', (col) => col.notNull())
    .addColumn('invite_token', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('pending'))
    .addColumn('invited_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('accepted_by', 'varchar(36)')
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('accepted_at', 'timestamp')
    .addColumn('cancelled_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 议题 ======
  await db.schema
    .createTable('issues')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('domain', 'varchar(20)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('draft'))
    .addColumn('owner_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('owner_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('tags', 'json', (col) => col.notNull().defaultTo('[]'))
    .addColumn('decision_due_at', 'timestamp', (col) => col.notNull())
    .addColumn('evidence_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('insight_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('decision_card_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_issues_tenant_status').on('issues').columns(['tenant_id', 'status']).execute()

  // ====== 证据 ======
  await db.schema
    .createTable('evidence')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('source_category', 'varchar(20)', (col) => col.notNull())
    .addColumn('source_type', 'varchar(30)', (col) => col.notNull())
    .addColumn('source_label', 'varchar(200)', (col) => col.notNull())
    .addColumn('source_ref', 'varchar(500)', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('summary', 'text', (col) => col.notNull())
    .addColumn('tags', 'json', (col) => col.notNull().defaultTo('[]'))
    .addColumn('confidence', 'decimal(3,2)', (col) => col.notNull())
    .addColumn('confidence_factors', 'json')
    .addColumn('freshness_at', 'timestamp', (col) => col.notNull())
    .addColumn('citation', 'varchar(500)', (col) => col.notNull())
    .addColumn('attachment_urls', 'json')
    .addColumn('import_job_id', 'varchar(36)')
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_evidence_tenant').on('evidence').columns(['tenant_id', 'source_category']).execute()

  // ====== 议题-证据关联（含立场分析）======
  await db.schema
    .createTable('issue_evidence')
    .addColumn('issue_id', 'varchar(36)', (col) => col.notNull().references('issues.id'))
    .addColumn('evidence_id', 'varchar(36)', (col) => col.notNull().references('evidence.id'))
    .addColumn('relation_type', 'varchar(10)', (col) => col.notNull().defaultTo('manual'))
    .addColumn('relevance_score', 'decimal(3,2)', (col) => col.notNull().defaultTo(0))
    .addColumn('stance', 'varchar(10)', (col) => col.notNull().defaultTo('neutral'))
    .addColumn('stance_source', 'varchar(10)', (col) => col.notNull().defaultTo('manual'))
    .addColumn('stance_confidence', 'decimal(3,2)', (col) => col.notNull().defaultTo(0))
    .addColumn('stance_reason', 'text', (col) => col.notNull())
    .addColumn('stance_version', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('stance_analyzed_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  await sql`ALTER TABLE issue_evidence ADD PRIMARY KEY (issue_id, evidence_id)`.execute(db)

  // ====== 洞察 ======
  await db.schema
    .createTable('insights')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('issue_id', 'varchar(36)', (col) => col.notNull().references('issues.id'))
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('type', 'varchar(20)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('draft'))
    .addColumn('source', 'varchar(20)', (col) => col.notNull())
    .addColumn('direction', 'varchar(10)', (col) => col.notNull())
    .addColumn('confidence', 'decimal(3,2)', (col) => col.notNull())
    .addColumn('score', 'decimal(5,2)', (col) => col.notNull())
    .addColumn('reasoning_run_id', 'varchar(36)')
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('confirmed_by', 'varchar(36)')
    .addColumn('confirmed_at', 'timestamp')
    .addColumn('disputed_by', 'varchar(36)')
    .addColumn('disputed_at', 'timestamp')
    .addColumn('dispute_reason', 'text')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_insights_issue').on('insights').columns(['tenant_id', 'issue_id']).execute()

  // ====== 洞察-证据关联 ======
  await db.schema
    .createTable('insight_evidence')
    .addColumn('insight_id', 'varchar(36)', (col) => col.notNull().references('insights.id'))
    .addColumn('evidence_id', 'varchar(36)', (col) => col.notNull().references('evidence.id'))
    .addColumn('support_type', 'varchar(20)', (col) => col.notNull())
    .addColumn('note', 'text')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await sql`ALTER TABLE insight_evidence ADD PRIMARY KEY (insight_id, evidence_id)`.execute(db)

  // ====== 推理运行 ======
  await db.schema
    .createTable('reasoning_runs')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('issue_id', 'varchar(36)', (col) => col.notNull().references('issues.id'))
    .addColumn('run_type', 'varchar(20)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('pending'))
    .addColumn('config', 'json')
    .addColumn('internal_analysis', 'json')
    .addColumn('external_analysis', 'json')
    .addColumn('synthesis', 'json')
    .addColumn('evidence_used_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('insight_generated_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('total_tokens', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('duration_ms', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_log', 'text')
    .addColumn('triggered_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('started_at', 'timestamp')
    .addColumn('completed_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 决策卡 ======
  await db.schema
    .createTable('decision_cards')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('issue_id', 'varchar(36)', (col) => col.notNull().references('issues.id'))
    .addColumn('reasoning_run_id', 'varchar(36)', (col) => col.notNull().references('reasoning_runs.id'))
    .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('recommendation', 'text', (col) => col.notNull())
    .addColumn('confidence', 'decimal(3,2)', (col) => col.notNull())
    .addColumn('key_factors', 'json', (col) => col.notNull())
    .addColumn('risks', 'json', (col) => col.notNull())
    .addColumn('dissent', 'text', (col) => col.notNull())
    .addColumn('suggested_actions', 'json', (col) => col.notNull())
    .addColumn('evidence_summary', 'json', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('draft'))
    .addColumn('adopted_by', 'varchar(36)')
    .addColumn('adopted_at', 'timestamp')
    .addColumn('rejected_by', 'varchar(36)')
    .addColumn('rejected_at', 'timestamp')
    .addColumn('decision_note', 'text')
    .addColumn('share_token', 'varchar(255)')
    .addColumn('share_expires_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 决策投票 ======
  await db.schema
    .createTable('decision_votes')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('decision_card_id', 'varchar(36)', (col) => col.notNull().references('decision_cards.id'))
    .addColumn('user_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('user_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('vote', 'varchar(10)', (col) => col.notNull())
    .addColumn('comment', 'text')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_votes_card').on('decision_votes').columns(['decision_card_id', 'user_id']).unique().execute()

  // ====== 行动项 ======
  await db.schema
    .createTable('actions')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('issue_id', 'varchar(36)', (col) => col.notNull().references('issues.id'))
    .addColumn('decision_card_id', 'varchar(36)', (col) => col.notNull().references('decision_cards.id'))
    .addColumn('parent_action_id', 'varchar(36)')
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('pending'))
    .addColumn('priority', 'varchar(10)', (col) => col.notNull().defaultTo('medium'))
    .addColumn('assignee_id', 'varchar(36)')
    .addColumn('assignee_name', 'varchar(100)')
    .addColumn('due_at', 'timestamp')
    .addColumn('completed_at', 'timestamp')
    .addColumn('completion_note', 'text')
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_actions_assignee').on('actions').columns(['tenant_id', 'assignee_id', 'status']).execute()

  // ====== 回看 ======
  await db.schema
    .createTable('reviews')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('issue_id', 'varchar(36)', (col) => col.notNull().references('issues.id'))
    .addColumn('decision_card_id', 'varchar(36)', (col) => col.notNull().references('decision_cards.id'))
    .addColumn('action_id', 'varchar(36)')
    .addColumn('outcome', 'varchar(30)', (col) => col.notNull())
    .addColumn('actual_result', 'text', (col) => col.notNull())
    .addColumn('expected_result', 'text', (col) => col.notNull())
    .addColumn('deviation', 'text', (col) => col.notNull())
    .addColumn('lessons_learned', 'text', (col) => col.notNull())
    .addColumn('tags', 'json', (col) => col.notNull().defaultTo('[]'))
    .addColumn('generated_evidence_id', 'varchar(36)')
    .addColumn('reviewed_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('reviewed_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 信号 ======
  await db.schema
    .createTable('signals')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('type', 'varchar(20)', (col) => col.notNull())
    .addColumn('severity', 'varchar(10)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('detected'))
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('evidence_ids', 'json', (col) => col.notNull().defaultTo('[]'))
    .addColumn('related_issue_ids', 'json', (col) => col.notNull().defaultTo('[]'))
    .addColumn('generated_insight_id', 'varchar(36)')
    .addColumn('detected_at', 'timestamp', (col) => col.notNull())
    .addColumn('acknowledged_by', 'varchar(36)')
    .addColumn('acknowledged_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_signals_tenant_severity').on('signals').columns(['tenant_id', 'severity', 'status']).execute()

  // ====== 数据源 ======
  await db.schema
    .createTable('data_sources')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('name', 'varchar(200)', (col) => col.notNull())
    .addColumn('type', 'varchar(20)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('active'))
    .addColumn('config', 'json', (col) => col.notNull())
    .addColumn('sync_frequency', 'varchar(20)', (col) => col.notNull().defaultTo('daily'))
    .addColumn('sync_cron_expression', 'varchar(50)')
    .addColumn('target_source_category', 'varchar(20)', (col) => col.notNull())
    .addColumn('target_source_type', 'varchar(30)', (col) => col.notNull())
    .addColumn('field_mapping', 'json')
    .addColumn('deduplication_key', 'varchar(100)')
    .addColumn('last_sync_at', 'timestamp')
    .addColumn('last_sync_status', 'varchar(20)')
    .addColumn('total_imported', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 导入任务 ======
  await db.schema
    .createTable('import_jobs')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('data_source_id', 'varchar(36)', (col) => col.notNull().references('data_sources.id'))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('pending'))
    .addColumn('total_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('processed_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('imported_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('skipped_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('failed_items', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('error_log', 'json')
    .addColumn('imported_evidence_ids', 'json', (col) => col.notNull().defaultTo('[]'))
    .addColumn('started_at', 'timestamp')
    .addColumn('completed_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 聊天会话 ======
  await db.schema
    .createTable('chat_sessions')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull().references('tenants.id'))
    .addColumn('user_id', 'varchar(36)', (col) => col.notNull().references('users.id'))
    .addColumn('issue_id', 'varchar(36)')
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`))
    .execute()

  // ====== 聊天消息 ======
  await db.schema
    .createTable('chat_messages')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('session_id', 'varchar(36)', (col) => col.notNull().references('chat_sessions.id'))
    .addColumn('role', 'varchar(10)', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('references', 'json')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_chat_messages_session').on('chat_messages').column('session_id').execute()

  // ====== 审计日志 ======
  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('user_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('action', 'varchar(50)', (col) => col.notNull())
    .addColumn('resource_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('resource_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('details', 'json')
    .addColumn('ip_address', 'varchar(45)')
    .addColumn('user_agent', 'varchar(500)')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_audit_tenant_time').on('audit_logs').columns(['tenant_id', 'created_at']).execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  const tables = [
    'audit_logs', 'chat_messages', 'chat_sessions',
    'import_jobs', 'data_sources',
    'signals', 'reviews', 'actions',
    'decision_votes', 'decision_cards', 'reasoning_runs',
    'insight_evidence', 'insights',
    'issue_evidence', 'evidence', 'issues',
    'invitations', 'password_history', 'refresh_tokens',
    'users', 'tenants',
  ]

  for (const table of tables) {
    await db.schema.dropTable(table).ifExists().execute()
  }
}
