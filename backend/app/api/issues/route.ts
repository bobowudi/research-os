// GET /api/issues — 列表
// POST /api/issues — 创建
import { NextRequest } from 'next/server'
import { issueService } from '@/modules/issues/service'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, created, readBody, parsePagination, parseQuery } from '@/shared/response'
import { createIssueSchema } from '@research-os/shared/src/validators/entities'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'issue', 'read')

  const pagination = parsePagination(req.url)
  const query = parseQuery(req.url)

  const result = await issueService.list({
    tenantId: auth.tenantId,
    ...pagination,
    status: query.status,
    domain: query.domain,
  })

  return ok(result)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'issue', 'create')

  const body = await readBody(req)
  const input = createIssueSchema.parse(body)
  const issue = await issueService.create(input, auth)

  return created(issue)
})
