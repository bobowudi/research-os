// ==================== 业务常量 ====================

/** 分页默认值 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

/** JWT 配置 */
export const AUTH = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_DAYS: 7,
  BCRYPT_ROUNDS: 12,
  INVITE_TOKEN_EXPIRES_HOURS: 72,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_HISTORY_COUNT: 5,
} as const

/** 租户默认配额 */
export const TENANT_QUOTAS = {
  free: { maxUsers: 3, maxIssues: 10, maxEvidencePerIssue: 50, maxDataSources: 2 },
  pro: { maxUsers: 50, maxIssues: 100, maxEvidencePerIssue: 500, maxDataSources: 20 },
  enterprise: { maxUsers: 500, maxIssues: 1000, maxEvidencePerIssue: 5000, maxDataSources: 100 },
} as const

/** AI / 推理引擎配置 */
export const AI = {
  DEFAULT_MODEL: 'claude-sonnet-4-20250514',
  MAX_EVIDENCE_PER_RUN: 200,
  MAX_TOKENS_PER_CALL: 4096,
  REASONING_TIMEOUT_MS: 120_000,
  SIGNAL_DETECTION_INTERVAL_MS: 300_000, // 5 min
} as const

/** 领域列表 */
export const DOMAINS = [
  { value: 'brand', label: '品牌' },
  { value: 'product', label: '产品' },
  { value: 'market', label: '市场' },
  { value: 'strategy', label: '战略' },
  { value: 'operations', label: '运营' },
] as const

/** 证据来源分类 */
export const EVIDENCE_SOURCE_TYPES = {
  internal: [
    { value: 'survey', label: '调研问卷' },
    { value: 'interview', label: '访谈' },
    { value: 'internal_data', label: '内部数据' },
    { value: 'historical', label: '历史数据' },
  ],
  external: [
    { value: 'social', label: '社交媒体' },
    { value: 'competitor', label: '竞品情报' },
    { value: 'report', label: '行业报告' },
    { value: 'news', label: '新闻资讯' },
    { value: 'manual', label: '手动录入' },
  ],
} as const

/** 洞察类型 */
export const INSIGHT_TYPES = [
  { value: 'finding', label: '发现' },
  { value: 'risk', label: '风险' },
  { value: 'opportunity', label: '机会' },
  { value: 'contradiction', label: '矛盾' },
] as const

/** 信号类型 */
export const SIGNAL_TYPES = [
  { value: 'risk', label: '风险信号' },
  { value: 'opportunity', label: '机会信号' },
  { value: 'trend', label: '趋势信号' },
  { value: 'anomaly', label: '异常信号' },
] as const

/** 信号严重程度 */
export const SIGNAL_SEVERITIES = [
  { value: 'low', label: '低', color: '#52c41a' },
  { value: 'medium', label: '中', color: '#faad14' },
  { value: 'high', label: '高', color: '#fa8c16' },
  { value: 'critical', label: '紧急', color: '#f5222d' },
] as const

/** 行动优先级 */
export const ACTION_PRIORITIES = [
  { value: 'low', label: '低优先', color: '#52c41a' },
  { value: 'medium', label: '中优先', color: '#faad14' },
  { value: 'high', label: '高优先', color: '#fa8c16' },
  { value: 'urgent', label: '紧急', color: '#f5222d' },
] as const
