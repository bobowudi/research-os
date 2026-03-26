// ==================== 共享工具函数 ====================

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, PaginatedResponse } from '@research-os/shared'

/** 成功响应 */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, { status })
}

/** 成功创建 */
export function created<T>(data: T): NextResponse {
  return ok(data, 201)
}

/** 无内容 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/** 分页响应 */
export function paginated<T>(data: PaginatedResponse<T>): NextResponse {
  return ok(data)
}

/** 从 URL 解析分页参数 */
export function parsePagination(url: string) {
  const { searchParams } = new URL(url)
  return {
    page: Number(searchParams.get('page')) || 1,
    pageSize: Math.min(Number(searchParams.get('pageSize')) || 20, 100),
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  }
}

/** 从 URL 解析 query 参数 */
export function parseQuery(url: string): Record<string, string> {
  const { searchParams } = new URL(url)
  const result: Record<string, string> = {}
  searchParams.forEach((v, k) => { result[k] = v })
  return result
}

/** 读取请求体 JSON，带类型 */
export async function readBody<T = unknown>(req: NextRequest): Promise<T> {
  return req.json() as Promise<T>
}

/** 生成 UUID v4 */
export { v4 as generateId } from 'uuid'
