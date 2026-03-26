// GET /api/dashboard
import { NextRequest } from 'next/server'
import { dashboardService } from '@/modules/dashboard/service'
import { requireAuth } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok } from '@/shared/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const data = await dashboardService.getOverview(auth)
  return ok(data)
})
