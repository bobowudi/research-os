// GET /api/auth/me
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok } from '@/shared/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const db = getDatabase()

  const user = await db
    .selectFrom('users')
    .select(['id', 'tenant_id', 'email', 'name', 'role', 'avatar_url', 'status', 'last_login_at', 'created_at'])
    .where('id', '=', auth.userId)
    .executeTakeFirstOrThrow()

  const tenant = await db
    .selectFrom('tenants')
    .select(['id', 'name', 'slug', 'plan'])
    .where('id', '=', auth.tenantId)
    .executeTakeFirstOrThrow()

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatar_url,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
    },
  })
})
