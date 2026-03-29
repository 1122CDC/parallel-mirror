import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(':')

  if (scheme !== 'scrypt' || !salt || !hash) {
    return false
  }

  const candidate = scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  const expected = Buffer.from(hash, 'hex')

  if (candidate.length !== expected.length) {
    return false
  }

  return timingSafeEqual(candidate, expected)
}
