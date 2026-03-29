import type { NextFunction, Request, Response } from 'express'
import { parseBearerToken } from '../auth/session'
import { runWithAdminAuthContext } from './context'
import { parseAdminToken } from './session'

export function createAdminAuthMiddleware() {
  return async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = parseBearerToken(req.headers.authorization)

    if (!token) {
      return res.status(401).json({ message: '请先登录管理员账号' })
    }

    const payload = parseAdminToken(token)

    if (!payload) {
      return res.status(401).json({ message: '管理员登录已过期，请重新登录' })
    }

    return runWithAdminAuthContext(
      {
        username: payload.username,
        displayName: payload.displayName,
        token,
      },
      () => next(),
    )
  }
}
