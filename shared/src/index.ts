// ==================== @research-os/shared 统一导出 ====================

// 领域类型
export * from './types/auth'
export * from './types/issue'
export * from './types/evidence'
export * from './types/insight'
export * from './types/decision'
export * from './types/action'
export * from './types/review'
export * from './types/signal'
export * from './types/data-source'
export * from './types/dashboard'
export * from './types/chat'
export * from './types/api'

// 常量
export * from './constants/roles'
export * from './constants/status'
export * from './constants/business'

// 验证器（按命名空间导出，避免命名冲突）
export * as authValidators from './validators/auth'
export * as entityValidators from './validators/entities'
