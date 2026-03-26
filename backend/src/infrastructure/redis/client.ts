// ==================== Redis 客户端 ====================

import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 5000)
      },
    })

    redis.on('error', (err) => {
      console.error('[Redis] 连接错误:', err.message)
    })
  }
  return redis
}

/** 缓存操作辅助 */
export const cache = {
  /** 获取缓存 */
  async get<T>(key: string): Promise<T | null> {
    const data = await getRedis().get(key)
    return data ? JSON.parse(data) : null
  },

  /** 设置缓存（秒） */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
  },

  /** 删除缓存 */
  async del(key: string): Promise<void> {
    await getRedis().del(key)
  },

  /** 按模式批量删除 */
  async delPattern(pattern: string): Promise<void> {
    const keys = await getRedis().keys(pattern)
    if (keys.length > 0) {
      await getRedis().del(...keys)
    }
  },

  /** 速率限制计数器 */
  async rateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    const r = getRedis()
    const current = await r.incr(key)
    if (current === 1) {
      await r.expire(key, windowSeconds)
    }
    return current <= maxRequests
  },
}
