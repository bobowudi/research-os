// ==================== 种子数据运行器 ====================

import { getDatabase, closeDatabase } from '../src/connection'
import { v4 as uuid } from 'uuid'

async function seed() {
  const db = getDatabase()

  console.log('🌱 开始插入种子数据...')

  // 创建默认租户
  const tenantId = uuid()
  await db.insertInto('tenants').values({
    id: tenantId,
    name: 'Demo Organization',
    slug: 'demo-org',
    industry: 'technology',
    team_size: '10-50',
    plan: 'pro',
    settings: JSON.stringify({
      maxUsers: 50,
      maxIssues: 100,
      maxEvidencePerIssue: 500,
      maxDataSources: 20,
      aiModelPreference: 'claude-sonnet-4-20250514',
    }),
    owner_id: 'placeholder', // 会在创建用户后更新
  }).execute()

  // 创建管理员用户（密码: Admin123!）
  // bcrypt hash of "Admin123!" with 12 rounds
  const adminId = uuid()
  await db.insertInto('users').values({
    id: adminId,
    tenant_id: tenantId,
    email: 'admin@demo.com',
    name: 'Demo Admin',
    password_hash: '$2b$12$LJ3EGFi.YiKsRnX1Hv7Yp.dJ8B4UqTn.YMPZVb.5UkR.ZwMlVkuS6', // Admin123!
    role: 'admin',
    status: 'active',
  }).execute()

  // 更新租户的 owner_id
  await db.updateTable('tenants')
    .set({ owner_id: adminId })
    .where('id', '=', tenantId)
    .execute()

  // 创建分析师用户
  await db.insertInto('users').values({
    id: uuid(),
    tenant_id: tenantId,
    email: 'analyst@demo.com',
    name: 'Demo Analyst',
    password_hash: '$2b$12$LJ3EGFi.YiKsRnX1Hv7Yp.dJ8B4UqTn.YMPZVb.5UkR.ZwMlVkuS6',
    role: 'analyst',
    status: 'active',
  }).execute()

  console.log('✅ 种子数据插入完成')
  console.log(`   租户 ID: ${tenantId}`)
  console.log(`   管理员: admin@demo.com / Admin123!`)
  console.log(`   分析师: analyst@demo.com / Admin123!`)

  await closeDatabase()
}

seed().catch((err) => {
  console.error('种子数据出错:', err)
  process.exit(1)
})
