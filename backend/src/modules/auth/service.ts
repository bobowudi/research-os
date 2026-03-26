// ==================== 认证服务 ====================

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '@research-os/database'
import type { JWTPayload, UserRole } from '@research-os/shared'
import { AUTH } from '@research-os/shared'
import { cache } from '@/infrastructure/redis/client'
import { AppError } from '@/middleware/error-handler'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'

export const authService = {
  /** 注册新租户 + 管理员 */
  async register(input: {
    email: string
    password: string
    name: string
    orgName: string
    orgSlug: string
    industry?: string
    teamSize?: string
  }) {
    const db = getDatabase()

    // 检查邮箱是否已存在
    const existingUser = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', input.email)
      .executeTakeFirst()

    if (existingUser) {
      throw new AppError('该邮箱已注册', 409, 'EMAIL_EXISTS')
    }

    // 检查 slug 唯一
    const existingTenant = await db
      .selectFrom('tenants')
      .select('id')
      .where('slug', '=', input.orgSlug)
      .executeTakeFirst()

    if (existingTenant) {
      throw new AppError('组织标识已被使用', 409, 'SLUG_EXISTS')
    }

    const tenantId = uuid()
    const userId = uuid()
    const passwordHash = await bcrypt.hash(input.password, AUTH.BCRYPT_ROUNDS)

    // 创建租户
    await db.insertInto('tenants').values({
      id: tenantId,
      name: input.orgName,
      slug: input.orgSlug,
      industry: input.industry || null,
      team_size: input.teamSize || null,
      plan: 'free',
      settings: JSON.stringify({
        maxUsers: 3,
        maxIssues: 10,
        maxEvidencePerIssue: 50,
        maxDataSources: 2,
      }),
      owner_id: userId,
    }).execute()

    // 创建用户
    await db.insertInto('users').values({
      id: userId,
      tenant_id: tenantId,
      email: input.email,
      name: input.name,
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
    }).execute()

    // 生成令牌
    return this.generateTokens(userId, tenantId, 'admin')
  },

  /** 登录 */
  async login(email: string, password: string) {
    const db = getDatabase()

    // 速率限制
    const rateLimitKey = `rate:login:${email}`
    const allowed = await cache.rateLimit(rateLimitKey, AUTH.MAX_LOGIN_ATTEMPTS, AUTH.LOCKOUT_DURATION_MINUTES * 60)
    if (!allowed) {
      throw new AppError(`登录尝试过多，请 ${AUTH.LOCKOUT_DURATION_MINUTES} 分钟后重试`, 429, 'RATE_LIMITED')
    }

    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .where('status', '=', 'active')
      .executeTakeFirst()

    if (!user) {
      throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    // 更新最后登录时间
    await db.updateTable('users')
      .set({ last_login_at: new Date().toISOString() })
      .where('id', '=', user.id)
      .execute()

    // 清除速率限制
    await cache.del(rateLimitKey)

    return this.generateTokens(user.id, user.tenant_id, user.role as UserRole)
  },

  /** 刷新令牌 */
  async refreshToken(refreshTokenStr: string) {
    const db = getDatabase()

    let payload: any
    try {
      payload = jwt.verify(refreshTokenStr, REFRESH_SECRET)
    } catch {
      throw new AppError('刷新令牌无效或已过期', 401, 'INVALID_REFRESH_TOKEN')
    }

    const tokenHash = await bcrypt.hash(refreshTokenStr, 4) // 轻量 hash
    const stored = await db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('user_id', '=', payload.sub)
      .where('revoked_at', 'is', null)
      .executeTakeFirst()

    if (!stored) {
      throw new AppError('刷新令牌已失效', 401, 'TOKEN_REVOKED')
    }

    // 吊销旧 token
    await db.updateTable('refresh_tokens')
      .set({ revoked_at: new Date().toISOString() })
      .where('id', '=', stored.id)
      .execute()

    // 获取用户信息
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', payload.sub)
      .where('status', '=', 'active')
      .executeTakeFirst()

    if (!user) {
      throw new AppError('用户不存在或已禁用', 401, 'USER_DISABLED')
    }

    return this.generateTokens(user.id, user.tenant_id, user.role as UserRole)
  },

  /** 登出 — 吊销所有刷新令牌 */
  async logout(userId: string) {
    const db = getDatabase()
    await db.updateTable('refresh_tokens')
      .set({ revoked_at: new Date().toISOString() })
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute()
  },

  /** 内部：生成 access + refresh 令牌对 */
  async generateTokens(userId: string, tenantId: string, role: UserRole) {
    const db = getDatabase()

    const accessToken = jwt.sign(
      { sub: userId, tid: tenantId, role } satisfies Omit<JWTPayload, 'iat' | 'exp'>,
      ACCESS_SECRET,
      { expiresIn: AUTH.ACCESS_TOKEN_EXPIRES_IN },
    )

    const refreshToken = jwt.sign(
      { sub: userId, tid: tenantId, type: 'refresh' },
      REFRESH_SECRET,
      { expiresIn: `${AUTH.REFRESH_TOKEN_EXPIRES_DAYS}d` },
    )

    // 存储 refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 4)
    await db.insertInto('refresh_tokens').values({
      id: uuid(),
      user_id: userId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRES_DAYS * 86400_000).toISOString(),
    }).execute()

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: { id: userId, tenantId, role },
    }
  },
}
