import { join } from 'node:path'
import { env } from '../config/env'

export function getUploadDir() {
  return env.uploadDir || join(process.cwd(), 'uploads')
}

export function sanitizeUploadFileName(originalName: string) {
  const safeName = originalName.trim().replace(/[^a-zA-Z0-9_.-]/g, '_')
  return safeName || 'file'
}

export function buildUploadFileName(id: string, originalName: string) {
  return `${id}-${sanitizeUploadFileName(originalName)}`
}
