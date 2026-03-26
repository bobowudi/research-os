// ==================== 数据源 (DataSource) & 导入任务 (ImportJob) ====================

export type DataSourceType = 'web_crawler' | 'rss_feed' | 'api_integration' | 'file_watch'
export type DataSourceStatus = 'active' | 'paused' | 'error' | 'disabled'
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'
export type ImportJobStatus = 'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled'

import type { EvidenceSourceCategory, EvidenceSourceType } from './evidence'

export interface DataSourceConfig {
  url?: string
  urlPattern?: string
  selectors?: Record<string, string>
  maxDepth?: number
  feedUrl?: string
  apiEndpoint?: string
  apiMethod?: 'GET' | 'POST'
  apiHeaders?: Record<string, string>
  apiBody?: string
  filePath?: string
  filePattern?: string
  authType?: 'none' | 'api_key' | 'oauth' | 'basic'
  authConfig?: Record<string, string>
  rateLimitPerMinute?: number
}

export interface DataSource {
  id: string
  tenantId: string
  name: string
  type: DataSourceType
  status: DataSourceStatus
  config: DataSourceConfig
  syncFrequency: SyncFrequency
  syncCronExpression?: string
  targetSourceCategory: EvidenceSourceCategory
  targetSourceType: EvidenceSourceType
  fieldMapping?: Record<string, string>
  deduplicationKey?: string
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'partial' | 'failed'
  totalImported: number
  errorCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ImportJob {
  id: string
  tenantId: string
  dataSourceId: string
  status: ImportJobStatus
  totalItems: number
  processedItems: number
  importedItems: number
  skippedItems: number
  failedItems: number
  errorLog?: string[]
  importedEvidenceIds: string[]
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}
