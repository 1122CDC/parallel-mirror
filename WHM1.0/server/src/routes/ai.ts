import { Router } from 'express'
import type { AppStore } from '../store/contracts'
import { asyncRoute } from '../utils/asyncRoute'
import { readOptionalText, readText } from '../utils/http'

export function createAiRouter(store: AppStore) {
  const router = Router()

  router.post(
    '/branches/preview',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const year = readText(body.year)
      const description = readText(body.description)

      if (!year || !description) {
        return res.status(400).json({ message: '年份和描述都是必填项' })
      }

      const preview = await store.generateBranchPreview(year, description)
      res.json(preview)
    }),
  )

  router.post(
    '/moments/generate',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const branchId = readText(body.branchId)
      const topic = readText(body.topic)

      const draft = await store.generateMomentDraft({
        branchId: branchId || undefined,
        topic: topic || undefined,
      })

      res.json(draft)
    }),
  )

  router.post(
    '/replies',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const branchId = readText(body.branchId)
      const comment = readText(body.comment)
      const momentContent = readOptionalText(body.momentContent)

      if (!branchId || !comment) {
        return res.status(400).json({ message: 'branchId 和 comment 都是必填项' })
      }

      const text = await store.generateReply({
        branchId,
        comment,
        momentContent: momentContent || undefined,
      })
      res.json({ text })
    }),
  )

  return router
}
