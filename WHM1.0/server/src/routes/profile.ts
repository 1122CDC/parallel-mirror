import { Router } from 'express'
import type { AppStore } from '../store/contracts'
import { asyncRoute } from '../utils/asyncRoute'
import { isGender, readNumber, readOptionalText, readText } from '../utils/http'

export function createProfileRouter(store: AppStore) {
  const router = Router()

  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      const profile = await store.getProfile()
      res.json(profile)
    }),
  )

  router.put(
    '/',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const nextGender = body.gender

      if (nextGender !== undefined && !isGender(nextGender)) {
        return res.status(400).json({ message: 'gender 只能是男或女' })
      }

      const nextAge = body.age
      if (nextAge !== undefined) {
        const age = readNumber(nextAge)
        if (age === null || age <= 0) {
          return res.status(400).json({ message: 'age 必须是正数' })
        }
      }

      const updated = await store.updateProfile({
        name: readOptionalText(body.name) || undefined,
        gender: nextGender as '男' | '女' | undefined,
        age: readNumber(nextAge) ?? undefined,
        profession: readOptionalText(body.profession) || undefined,
        city: readOptionalText(body.city) || undefined,
        bio: readText(body.bio) || undefined,
      })

      res.json(updated)
    }),
  )

  return router
}
