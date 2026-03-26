// POST /api/auth/refresh
import { NextRequest } from 'next/server'
import { authService } from '@/modules/auth/service'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, readBody } from '@/shared/response'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await readBody<{ refreshToken: string }>(req)
  const result = await authService.refreshToken(body.refreshToken)
  return ok(result)
})
