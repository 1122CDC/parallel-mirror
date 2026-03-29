import type { PrismaClient } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { runWithAuthContext } from './context'
import { getSessionByToken, parseBearerToken } from './session'

export function createAuthMiddleware(prisma: PrismaClient) {
  return async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = parseBearerToken(req.headers.authorization)

    if (!token) {
      return res.status(401).json({ message: '请先登录' })
    }

    const session = await getSessionByToken(prisma, token)

    if (!session) {
      return res.status(401).json({ message: '登录已过期，请重新登录' })
    }

    return runWithAuthContext({ userId: session.userId, token: session.token }, () => next())
  }
}
