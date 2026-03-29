import { Router } from 'express'
import type { AppStore } from '../store/contracts'
import { asyncRoute } from '../utils/asyncRoute'
import { readOptionalText, readText } from '../utils/http'

export function createBranchesRouter(store: AppStore) {
  const router = Router()

  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      const branches = await store.listBranches()
      res.json(branches)
    }),
  )

  router.get(
    '/:id',
    asyncRoute(async (req, res) => {
      const branchId = String(req.params.id)
      const branch = await store.getBranchById(branchId)
      if (!branch) {
        return res.status(404).json({ message: '分身不存在' })
      }

      res.json(branch)
    }),
  )

  router.post(
    '/preview',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const year = readText(body.year)
      const description = readText(body.description)

      if (!year || !description) {
        return res.status(400).json({ message: 'year 和 description 不能为空' })
      }

      const preview = await store.generateBranchPreview(year, description)
      res.json(preview)
    }),
  )

  router.post(
    '/',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>

      const preview = {
        name: readText(body.name),
        profession: readText(body.profession),
        workplace: readText(body.workplace),
        icon: readText(body.icon),
        color: readText(body.color),
        bio: readText(body.bio),
      }

      if (!preview.name || !preview.profession || !preview.workplace || !preview.icon || !preview.color || !preview.bio) {
        return res.status(400).json({ message: '分身草稿字段不完整' })
      }

      const branch = await store.createBranchFromPreview(preview)
      res.status(201).json(branch)
    }),
  )

  router.patch(
    '/:id',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const branchId = String(req.params.id)
      const branch = await store.updateBranch(branchId, {
        name: readOptionalText(body.name) || undefined,
        profession: readOptionalText(body.profession) || undefined,
        workplace: readOptionalText(body.workplace) || undefined,
        world: readOptionalText(body.world) || undefined,
        icon: readOptionalText(body.icon) || undefined,
        color: readOptionalText(body.color) || undefined,
        bio: readOptionalText(body.bio) || undefined,
        cover: readOptionalText(body.cover) || undefined,
        status: body.status === 'ready' || body.status === 'syncing' ? body.status : undefined,
      })

      if (!branch) {
        return res.status(404).json({ message: '分身不存在' })
      }

      res.json(branch)
    }),
  )

  return router
}
