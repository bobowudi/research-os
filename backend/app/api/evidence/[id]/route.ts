// GET /api/evidence/:id
import { NextRequest } from 'next/server'
import { evidenceService } from '@/modules/evidence/service'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok } from '@/shared/response'

interface Params { params: { id: string } }

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'evidence', 'read')
  const evidence = await evidenceService.findById(params.id, auth.tenantId)
  return ok(evidence)
})
