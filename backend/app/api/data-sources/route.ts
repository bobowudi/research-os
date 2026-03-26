// GET /api/data-sources — 列表
// POST /api/data-sources — 创建
import { NextRequest } from 'next/server'
import { getDatabase } from '@research-os/database'
import { requireAuth, requirePermission } from '@/middleware/auth'
import { withErrorHandler } from '@/middleware/error-handler'
import { ok, created, readBody, parsePagination, generateId } from '@/shared/response'
import { createDataSourceSchema } from '@research-os/shared/src/validators/entities'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'data_source', 'read')
  const { page, pageSize } = parsePagination(req.url)
  const db = getDatabase()
  const offset = (page - 1) * pageSize

  const items = await db.selectFrom('data_sources').selectAll()
    .where('tenant_id', '=', auth.tenantId)
    .orderBy('created_at', 'desc').limit(pageSize).offset(offset).execute()

  return ok({ items, page, pageSize })
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req)
  requirePermission(auth, 'data_source', 'create')
  const body = await readBody(req)
  const input = createDataSourceSchema.parse(body)
  const db = getDatabase()
  const id = generateId()

  await db.insertInto('data_sources').values({
    id,
    tenant_id: auth.tenantId,
    name: input.name,
    type: input.type,
    status: 'active',
    config: JSON.stringify(input.config),
    sync_frequency: input.syncFrequency,
    target_source_category: input.targetSourceCategory,
    target_source_type: input.targetSourceType,
    field_mapping: input.fieldMapping ? JSON.stringify(input.fieldMapping) : null,
    deduplication_key: input.deduplicationKey || null,
    created_by: auth.userId,
  }).execute()

  const result = await db.selectFrom('data_sources').selectAll().where('id', '=', id).executeTakeFirst()
  return created(result)
})
