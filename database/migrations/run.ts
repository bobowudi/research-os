// ==================== 迁移运行器 ====================

import { Kysely, MysqlDialect, Migrator, FileMigrationProvider } from 'kysely'
import { createPool } from 'mysql2'
import * as path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  const pool = createPool({
    host: process.env.TIDB_HOST || 'localhost',
    port: Number(process.env.TIDB_PORT) || 4000,
    user: process.env.TIDB_USER || 'root',
    password: process.env.TIDB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || 'research_os',
  })

  const db = new Kysely<any>({
    dialect: new MysqlDialect({ pool }),
  })

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: __dirname,
    }),
  })

  const command = process.argv[2] || 'latest'

  if (command === 'latest') {
    const { error, results } = await migrator.migrateToLatest()
    results?.forEach((it) => {
      if (it.status === 'Success') {
        console.log(`✅ 迁移成功: ${it.migrationName}`)
      } else if (it.status === 'Error') {
        console.error(`❌ 迁移失败: ${it.migrationName}`)
      }
    })
    if (error) {
      console.error('迁移出错:', error)
      process.exit(1)
    }
  } else if (command === 'down') {
    const { error, results } = await migrator.migrateDown()
    results?.forEach((it) => {
      console.log(`⬇️  回滚: ${it.migrationName} — ${it.status}`)
    })
    if (error) {
      console.error('回滚出错:', error)
      process.exit(1)
    }
  }

  await db.destroy()
  console.log('🏁 迁移完成')
}

runMigrations()
