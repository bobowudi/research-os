// ==================== Zod 验证器 — 认证相关 ====================

import { z } from 'zod'
import { AUTH } from '../constants/business'

/** 密码规则：至少8位，包含大小写字母、数字和特殊字符 */
export const passwordSchema = z
  .string()
  .min(AUTH.PASSWORD_MIN_LENGTH, `密码至少 ${AUTH.PASSWORD_MIN_LENGTH} 位`)
  .regex(/[A-Z]/, '必须包含大写字母')
  .regex(/[a-z]/, '必须包含小写字母')
  .regex(/[0-9]/, '必须包含数字')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, '必须包含特殊字符')

/** 邮箱 */
export const emailSchema = z.string().email('邮箱格式不正确').max(255)

/** 注册请求 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, '姓名至少2个字符').max(100),
  orgName: z.string().min(2, '组织名称至少2个字符').max(100),
  orgSlug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, '仅允许小写字母、数字和连字符'),
  industry: z.string().max(50).optional(),
  teamSize: z.string().max(20).optional(),
})

/** 登录请求 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '请输入密码'),
})

/** 邀请注册（通过邀请链接） */
export const inviteRegisterSchema = z.object({
  inviteToken: z.string().min(1),
  name: z.string().min(2).max(100),
  password: passwordSchema,
})

/** 忘记密码 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

/** 重置密码 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
})

/** 修改密码 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})

/** 发送邀请 */
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['analyst', 'viewer']),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type InviteRegisterInput = z.infer<typeof inviteRegisterSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
