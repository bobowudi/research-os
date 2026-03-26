// ==================== @research-os/database 入口 ====================

export { getDatabase, closeDatabase } from './src/connection'
export type { Database } from './schema/tables'
export type {
  TenantTable,
  UserTable,
  RefreshTokenTable,
  PasswordHistoryTable,
  InvitationTable,
  IssueTable,
  EvidenceTable,
  IssueEvidenceTable,
  InsightTable,
  InsightEvidenceTable,
  ReasoningRunTable,
  DecisionCardTable,
  DecisionVoteTable,
  ActionTable,
  ReviewTable,
  SignalTable,
  DataSourceTable,
  ImportJobTable,
  ChatSessionTable,
  ChatMessageTable,
  AuditLogTable,
} from './schema/tables'
