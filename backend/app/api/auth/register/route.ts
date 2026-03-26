// POST /api/auth/register
import { NextRequest } from 'next/server'
import { authService } from '@/modules/auth/service'
import { registerSchema } from '@research-os/shared/src/validators/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { created, readBody } from '@/shared/response'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await readBody(req)
  const input = registerSchema.parse(body)
  const result = await authService.register(input)
  return created(result)
})
