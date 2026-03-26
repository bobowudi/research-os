// GET /api/evidence — 列表
// POST /api/evidence — 创建
import { NextRequest } from 'next/server'
import { evidenceService } from '@/modules/evidence/service'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, created, readBody, parsePagination, parseQuery } from '@/shared/response'
import { createEvidenceSchema } from '@research-os/shared/src/validators/entities'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'evidence', 'read')

  const pagination = parsePagination(req.url)
  const query = parseQuery(req.url)

  const result = await evidenceService.list({
    tenantId: auth.tenantId,
    ...pagination,
    sourceCategory: query.sourceCategory,
    sourceType: query.sourceType,
  })

  return ok(result)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'evidence', 'create')

  const body = await readBody(req)
  const input = createEvidenceSchema.parse(body)
  const evidence = await evidenceService.create(input, auth)

  return created(evidence)
})
