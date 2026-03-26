// POST /api/auth/logout
import { NextRequest } from 'next/server'
import { authService } from '@/modules/auth/service'
import { requireAuth } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { noContent } from '@/shared/response'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  await authService.logout(auth.userId)
  return noContent()
})
