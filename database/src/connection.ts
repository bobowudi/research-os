// ==================== 数据库连接配置 ====================

import { Kysely, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'
import type { Database } from '../schema/tables'

let db: Kysely<Database> | null = null

export function getDatabase(): Kysely<Database> {
  if (!db) {
    const pool = createPool({
      host: process.env.TIDB_HOST || 'localhost',
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER || 'root',
      password: process.env.TIDB_PASSWORD || '',
      database: process.env.TIDB_DATABASE || 'research_os',
      ssl: process.env.TIDB_SSL === 'true'
        ? { rejectUnauthorized: true }
        : undefined,
      connectionLimit: Number(process.env.TIDB_POOL_SIZE) || 10,
    })

    db = new Kysely<Database>({
      dialect: new MysqlDialect({ pool }),
    })
  }

  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy()
    db = null
  }
}
