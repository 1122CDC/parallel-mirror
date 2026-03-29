import { join } from 'node:path'

export function getUploadDir() {
  return join(process.cwd(), 'uploads')
}

export function sanitizeUploadFileName(originalName: string) {
  const safeName = originalName.trim().replace(/[^a-zA-Z0-9_.-]/g, '_')
  return safeName || 'file'
}

export function buildUploadFileName(id: string, originalName: string) {
  return `${id}-${sanitizeUploadFileName(originalName)}`
}
