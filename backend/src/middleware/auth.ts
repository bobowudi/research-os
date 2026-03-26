// ==================== 认证中间件 ====================

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import type { JWTPayload, AuthContext } from '@research-os/shared'
import { ROLE_PERMISSIONS } from '@research-os/shared'

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-secret-change-me'

/** 从请求头解析 JWT，返回 AuthContext */
export function extractAuth(req: NextRequest): AuthContext | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  try {
    const token = authHeader.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    return {
      userId: payload.sub,
      tenantId: payload.tid,
      role: payload.role,
      permissions: ROLE_PERMISSIONS[payload.role] || [],
    }
  } catch {
    return null
  }
}

/** 鉴权守卫：要求有效 JWT */
export function requireAuth(req: NextRequest): AuthContext {
  const auth = extractAuth(req)
  if (!auth) {
    throw new AuthError('未登录或令牌已过期', 401)
  }
  return auth
}

/** RBAC 守卫：要求特定资源权限 */
export function requirePermission(
  auth: AuthContext,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
): void {
  const hasPerm = auth.permissions.some(
    (p) => p.resource === resource && p.actions.includes(action),
  )
  if (!hasPerm) {
    throw new AuthError('权限不足', 403)
  }
}

/** 租户隔离守卫：确保操作的数据属于当前租户 */
export function requireTenant(auth: AuthContext, dataTenantId: string): void {
  if (auth.tenantId !== dataTenantId) {
    throw new AuthError('无权访问其他租户数据', 403)
  }
}

/** 认证错误 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
