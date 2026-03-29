import { Router } from 'express'
import type { AppStore } from '../store/contracts'
import { asyncRoute } from '../utils/asyncRoute'
import { readOptionalText, readText } from '../utils/http'

export function createMomentsRouter(store: AppStore) {
  const router = Router()

  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      const moments = await store.listMoments()
      res.json(moments)
    }),
  )

  router.post(
    '/',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const branchId = readText(body.branchId)
      const content = readText(body.content)
      const imageUrl = readOptionalText(body.imageUrl)

      if (!branchId || !content) {
        return res.status(400).json({ message: 'branchId 和 content 不能为空' })
      }

      const moment = await store.createMoment({
        branchId,
        content,
        imageUrl: imageUrl || null,
      })

      if (!moment) {
        return res.status(404).json({ message: '分身不存在' })
      }

      res.status(201).json(moment)
    }),
  )

  router.post(
    '/:id/like',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const userName = readOptionalText(body.userName) || '未命名用户'
      const momentId = String(req.params.id)
      const moment = await store.toggleLike(momentId, userName)

      if (!moment) {
        return res.status(404).json({ message: '朋友圈不存在' })
      }

      res.json(moment)
    }),
  )

  router.post(
    '/:id/comments',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const userName = readOptionalText(body.userName) || '未命名用户'
      const text = readText(body.text)

      if (!text) {
        return res.status(400).json({ message: 'text 不能为空' })
      }

      const momentId = String(req.params.id)
      const result = await store.addComment(momentId, userName, text)
      if (!result) {
        return res.status(404).json({ message: '朋友圈不存在' })
      }

      res.status(201).json(result)
    }),
  )

  return router
}
