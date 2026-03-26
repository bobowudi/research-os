// ==================== 认证相关类型 ====================

export type UserRole = 'admin' | 'analyst' | 'viewer'
export type UserStatus = 'active' | 'disabled'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface Tenant {
  id: string
  name: string
  slug: string
  industry?: string
  teamSize?: string
  plan: 'free' | 'pro' | 'enterprise'
  settings: TenantSettings
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface TenantSettings {
  maxUsers: number
  maxIssues: number
  maxEvidencePerIssue: number
  maxDataSources: number
  aiModelPreference?: string
  defaultDomain?: string
}

export interface User {
  id: string
  tenantId: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
  status: UserStatus
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuthContext {
  userId: string
  tenantId: string
  role: UserRole
  permissions: Permission[]
}

export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}

export interface JWTPayload {
  sub: string   // userId
  tid: string   // tenantId
  role: UserRole
  iat: number
  exp: number
}

export interface Invitation {
  id: string
  tenantId: string
  email: string
  role: 'analyst' | 'viewer'
  inviteToken: string
  status: InviteStatus
  invitedBy: string
  acceptedBy?: string
  expiresAt: string
  acceptedAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}
