import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env'
import { verifyPassword } from '../auth/password'

export interface AdminIdentity {
  username: string
  displayName: string
}

export interface AdminTokenPayload extends AdminIdentity {
  iat: number
  exp: number
  role: 'admin'
}

function encodePayload(payload: AdminTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(raw: string) {
  const text = Buffer.from(raw, 'base64url').toString('utf8')
  return JSON.parse(text) as AdminTokenPayload
}

function signPayload(rawPayload: string) {
  return createHmac('sha256', env.adminTokenSecret).update(rawPayload).digest('base64url')
}

function isPayloadValid(payload: AdminTokenPayload) {
  return (
    payload.role === 'admin' &&
    payload.username === env.adminUsername &&
    payload.displayName === env.adminDisplayName &&
    payload.exp > Date.now()
  )
}

export function verifyAdminCredentials(username: string, password: string) {
  if (username !== env.adminUsername) {
    return false
  }

  return verifyPassword(password, env.adminPasswordHash)
}

export function createAdminToken(identity: AdminIdentity) {
  const now = Date.now()
  const payload: AdminTokenPayload = {
    username: identity.username,
    displayName: identity.displayName,
    iat: now,
    exp: now + env.adminTokenTtlMs,
    role: 'admin',
  }

  const encoded = encodePayload(payload)
  return `${encoded}.${signPayload(encoded)}`
}

export function parseAdminToken(token: string) {
  try {
    const [payloadPart, signaturePart] = token.split('.')

    if (!payloadPart || !signaturePart) {
      return null
    }

    const expectedSignature = Buffer.from(signPayload(payloadPart), 'base64url')
    const providedSignature = Buffer.from(signaturePart, 'base64url')

    if (expectedSignature.length !== providedSignature.length) {
      return null
    }

    if (!timingSafeEqual(expectedSignature, providedSignature)) {
      return null
    }

    const payload = decodePayload(payloadPart)
    if (!isPayloadValid(payload)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
