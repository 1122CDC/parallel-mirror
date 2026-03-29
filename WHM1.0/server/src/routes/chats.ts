import { Router } from 'express'
import type { AppStore } from '../store/contracts'
import { asyncRoute } from '../utils/asyncRoute'
import { readText } from '../utils/http'

export function createChatsRouter(store: AppStore) {
  const router = Router()

  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      const cards = await store.listChatCards()
      res.json(cards)
    }),
  )

  router.get(
    '/:branchId/messages',
    asyncRoute(async (req, res) => {
      const branchId = String(req.params.branchId)
      const branch = await store.getBranchById(branchId)
      if (!branch) {
        return res.status(404).json({ message: '分身不存在' })
      }

      const messages = await store.getMessagesByPartnerId(branch.id)
      res.json(messages)
    }),
  )

  router.post(
    '/:branchId/messages',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const text = readText(body.text)
      if (!text) {
        return res.status(400).json({ message: 'text 不能为空' })
      }

      const branchId = String(req.params.branchId)
      const result = await store.sendMessage(branchId, text)
      if (!result) {
        return res.status(404).json({ message: '分身不存在' })
      }

      res.status(201).json(result)
    }),
  )

  return router
}
