import { PrismaClient } from '@prisma/client'
import { join } from 'node:path'

const isProduction = process.env.NODE_ENV === 'production'

if (!process.env.DATABASE_URL) {
  if (isProduction) {
    throw new Error('DATABASE_URL 未配置，生产环境必须显式连接外部数据库')
  }

  const baseDir = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'WHM1') : process.cwd()
  const dbPath = join(baseDir, 'dev.db').replace(/\\/g, '/')
  process.env.DATABASE_URL = `file:${dbPath}`
}

export const prisma = new PrismaClient()
