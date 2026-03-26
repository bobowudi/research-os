// GET /api/issues/:id
// PATCH /api/issues/:id
// DELETE /api/issues/:id
import { NextRequest } from 'next/server'
import { issueService } from '@/modules/issues/service'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, noContent, readBody } from '@/shared/response'
import { updateIssueSchema } from '@research-os/shared/src/validators/entities'

interface Params { params: { id: string } }

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'issue', 'read')
  const issue = await issueService.findById(params.id, auth.tenantId)
  return ok(issue)
})

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'issue', 'update')
  const body = await readBody(req)
  const input = updateIssueSchema.parse(body)
  const issue = await issueService.update(params.id, input, auth)
  return ok(issue)
})

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'issue', 'delete')
  await issueService.delete(params.id, auth)
  return noContent()
})
