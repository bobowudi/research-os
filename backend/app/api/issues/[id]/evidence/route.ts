// POST /api/issues/:id/evidence — 关联证据
import { NextRequest } from 'next/server'
import { evidenceService } from '@/modules/evidence/service'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { created, readBody } from '@/shared/response'
import { linkEvidenceSchema } from '@research-os/shared/src/validators/entities'

interface Params { params: { id: string } }

export const POST = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'evidence', 'create')

  const body = await readBody(req)
  const input = linkEvidenceSchema.parse(body)
  await evidenceService.linkToIssue(params.id, input.evidenceId, input, auth)

  return created({ issueId: params.id, evidenceId: input.evidenceId })
})
