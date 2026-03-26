// ==================== 角色与权限定义 ====================

import type { UserRole, Permission } from '../types/auth'

/** 各角色的默认权限 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'tenant', actions: ['read', 'update'] },
    { resource: 'user', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invitation', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'issue', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'evidence', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'insight', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'decision', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'action', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'review', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'signal', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'data_source', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'chat', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'reasoning', actions: ['create', 'read'] },
    { resource: 'audit_log', actions: ['read'] },
  ],
  analyst: [
    { resource: 'issue', actions: ['create', 'read', 'update'] },
    { resource: 'evidence', actions: ['create', 'read', 'update'] },
    { resource: 'insight', actions: ['create', 'read', 'update'] },
    { resource: 'decision', actions: ['read', 'update'] },
    { resource: 'action', actions: ['create', 'read', 'update'] },
    { resource: 'review', actions: ['create', 'read', 'update'] },
    { resource: 'signal', actions: ['read', 'update'] },
    { resource: 'data_source', actions: ['read'] },
    { resource: 'chat', actions: ['create', 'read'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'reasoning', actions: ['create', 'read'] },
    { resource: 'user', actions: ['read'] },
  ],
  viewer: [
    { resource: 'issue', actions: ['read'] },
    { resource: 'evidence', actions: ['read'] },
    { resource: 'insight', actions: ['read'] },
    { resource: 'decision', actions: ['read'] },
    { resource: 'action', actions: ['read'] },
    { resource: 'review', actions: ['read'] },
    { resource: 'signal', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'chat', actions: ['create', 'read'] },
    { resource: 'user', actions: ['read'] },
  ],
}

/** 角色显示名称 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理员',
  analyst: '分析师',
  viewer: '观察者',
}

/** 角色层级（数值越大权限越高） */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
}

/** 检查角色 A 是否 >= 角色 B */
export function hasHigherOrEqualRole(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB]
}

/** 检查角色是否拥有特定资源的特定动作权限 */
export function hasPermission(
  role: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
): boolean {
  const perms = ROLE_PERMISSIONS[role]
  return perms.some((p) => p.resource === resource && p.actions.includes(action))
}
