// ==================== 邮件服务 ====================

import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    })
  }
  return transporter
}

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const mail = getTransporter()
  await mail.sendMail({
    from: process.env.SMTP_FROM || '"ResearchOS" <noreply@research-os.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

/** 发送邀请邮件 */
export async function sendInvitationEmail(params: {
  email: string
  inviterName: string
  orgName: string
  inviteToken: string
  role: string
}): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const inviteUrl = `${frontendUrl}/invite/${params.inviteToken}`

  await sendMail({
    to: params.email,
    subject: `${params.inviterName} 邀请你加入 ${params.orgName} — ResearchOS`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>你收到一封团队邀请</h2>
        <p><strong>${params.inviterName}</strong> 邀请你以 <strong>${params.role}</strong> 身份加入 <strong>${params.orgName}</strong>。</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#1677ff;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">接受邀请</a>
        <p style="color:#666;font-size:14px;">此链接 72 小时内有效。如果你不认识邀请人，请忽略此邮件。</p>
      </div>
    `,
  })
}

/** 发送密码重置邮件 */
export async function sendPasswordResetEmail(params: {
  email: string
  resetToken: string
}): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const resetUrl = `${frontendUrl}/reset-password/${params.resetToken}`

  await sendMail({
    to: params.email,
    subject: '重置你的 ResearchOS 密码',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>密码重置请求</h2>
        <p>我们收到了重置你 ResearchOS 账号密码的请求。</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#1677ff;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">重置密码</a>
        <p style="color:#666;font-size:14px;">此链接 1 小时内有效。如果你没有请求重置密码，请忽略此邮件。</p>
      </div>
    `,
  })
}
