// ==================== 统一错误处理 ====================

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError } from '@/middleware/auth'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} (${id}) 不存在` : `${resource} 不存在`,
      404,
      'NOT_FOUND',
    )
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

/** 统一错误响应 */
export function handleError(error: unknown): NextResponse {
  // Zod 验证错误
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求参数验证失败',
          details: { issues: error.issues },
        },
      },
      { status: 400 },
    )
  }

  // 认证错误
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED',
          message: error.message,
        },
      },
      { status: error.statusCode },
    )
  }

  // 业务错误
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    )
  }

  // 未知错误
  console.error('[UnhandledError]', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      },
    },
    { status: 500 },
  )
}

/** API 路由包装器：统一 try-catch + 错误转换 */
export function withErrorHandler(
  handler: (...args: any[]) => Promise<NextResponse>,
) {
  return async (...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleError(error)
    }
  }
}
