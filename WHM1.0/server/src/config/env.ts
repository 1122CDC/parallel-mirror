import './loadEnv'
import { hashPassword } from '../auth/password'
import { join } from 'node:path'

export interface ServerEnv {
  port: number
  corsOrigins: string[]
  uploadDir: string
  deepseekBaseUrl: string
  deepseekApiKey: string
  deepseekTextModel: string
  aiProxyBaseUrl: string
  aiProxyApiKey: string
  aiImageModel: string
  aiRequestTimeoutMs: number
  adminUsername: string
  adminDisplayName: string
  adminPasswordHash: string
  adminTokenSecret: string
  adminTokenTtlMs: number
}

function toPort(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toList(value: string | undefined, fallback: string[]) {
  const list = value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return list && list.length > 0 ? list : fallback
}

export const env: ServerEnv = {
  port: toPort(process.env.PORT, 3001),
  corsOrigins: toList(process.env.CORS_ORIGINS || process.env.CORS_ORIGIN, [
    'http://localhost:5173',
    'http://localhost:4173',
  ]),
  uploadDir: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekTextModel: process.env.DEEPSEEK_TEXT_MODEL || process.env.AI_TEXT_MODEL || 'deepseek-chat',
  aiProxyBaseUrl: process.env.AI_PROXY_BASE_URL || 'https://128api.cn/v1',
  aiProxyApiKey: process.env.AI_PROXY_API_KEY || process.env.PROXY_API_KEY || '',
  aiImageModel: process.env.AI_IMAGE_MODEL || 'gemini-2.0-flash-exp-image-generation',
  aiRequestTimeoutMs: toNumber(process.env.AI_REQUEST_TIMEOUT_MS, 60_000),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminDisplayName: process.env.ADMIN_DISPLAY_NAME || '后台管理员',
  adminPasswordHash:
    process.env.ADMIN_PASSWORD_HASH || hashPassword(process.env.ADMIN_PASSWORD || 'admin123456'),
  adminTokenSecret: process.env.ADMIN_TOKEN_SECRET || 'whm-admin-secret-dev',
  adminTokenTtlMs: toNumber(process.env.ADMIN_TOKEN_TTL_MS, 1000 * 60 * 60 * 24),
}
