// POST /api/auth/login
import { NextRequest } from 'next/server'
import { authService } from '@/modules/auth/service'
import { loginSchema } from '@research-os/shared/src/validators/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, readBody } from '@/shared/response'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await readBody(req)
  const input = loginSchema.parse(body)
  const result = await authService.login(input.email, input.password)
  return ok(result)
})
