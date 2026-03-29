import type { PrismaClient } from '@prisma/client'
import { randomBytes } from 'node:crypto'

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function parseBearerToken(value: string | string[] | undefined) {
  if (!value) return ''

  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return ''

  const [scheme, token] = raw.trim().split(/\s+/, 2)
  if (scheme !== 'Bearer' || !token) return ''

  return token.trim()
}

export async function createSession(prisma: PrismaClient, userId: string) {
  const now = Date.now()
  const token = createSessionToken()

  await prisma.authSession.create({
    data: {
      token,
      userId,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now + SESSION_TTL_MS,
    },
  })

  return token
}

export async function getSessionByToken(prisma: PrismaClient, token: string) {
  const session = await prisma.authSession.findUnique({
    where: { token },
  })

  if (!session) {
    return null
  }

  if (session.expiresAt <= Date.now()) {
    await prisma.authSession.delete({
      where: { token },
    })
    return null
  }

  return session
}

export async function revokeSession(prisma: PrismaClient, token: string) {
  await prisma.authSession.delete({
    where: { token },
  }).catch(() => undefined)
}
