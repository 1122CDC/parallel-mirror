import { Router } from 'express'
import type { AppStore } from '../store/contracts'
import { asyncRoute } from '../utils/asyncRoute'

export function createDebugRouter(store: AppStore) {
  const router = Router()

  router.post(
    '/reset',
    asyncRoute(async (_req, res) => {
      await store.reset()
      res.json({ ok: true })
    }),
  )

  return router
}
