// ==================== 文件存储服务 ====================

import { promises as fs } from 'fs'
import path from 'path'

const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/research-os-uploads'

/** 确保目录存在 */
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

/** 上传文件到本地存储（后期可替换为 S3） */
export async function uploadFile(params: {
  tenantId: string
  filename: string
  buffer: Buffer
  contentType: string
}): Promise<string> {
  const dir = path.join(STORAGE_DIR, params.tenantId)
  await ensureDir(dir)

  const ext = path.extname(params.filename)
  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const filePath = path.join(dir, storedName)

  await fs.writeFile(filePath, params.buffer)

  // 返回可访问的 URL 路径
  return `/api/files/${params.tenantId}/${storedName}`
}

/** 读取文件 */
export async function readFile(tenantId: string, filename: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(STORAGE_DIR, tenantId, filename)
    return await fs.readFile(filePath)
  } catch {
    return null
  }
}

/** 删除文件 */
export async function deleteFile(tenantId: string, filename: string): Promise<void> {
  try {
    const filePath = path.join(STORAGE_DIR, tenantId, filename)
    await fs.unlink(filePath)
  } catch {
    // 文件不存在时静默失败
  }
}
