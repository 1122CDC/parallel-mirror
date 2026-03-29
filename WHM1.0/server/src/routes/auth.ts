import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from '../db/client'
import { asyncRoute } from '../utils/asyncRoute'
import { readText } from '../utils/http'
import { makeId } from '../utils/id'
import { getAuthContext } from '../auth/context'
import { createSession, revokeSession } from '../auth/session'
import { hashPassword, verifyPassword } from '../auth/password'
import type { AuthUser } from '../types/domain'

type AuthProfileRow = {
  name: string
  gender: string
  age: number
  profession: string
  city: string
  bio: string
  mainBranchId: string | null
}

type AuthUserRow = {
  id: string
  phone: string | null
  passwordHash: string | null
  nickname: string | null
  avatarUrl: string | null
  profile: AuthProfileRow | null
}

function toAuthUser(user: AuthUserRow): AuthUser {
  return {
    id: user.id,
    phone: user.phone ?? '',
    nickname: user.nickname ?? user.profile?.name ?? '未命名用户',
    avatarUrl: user.avatarUrl ?? null,
  }
}

function toProfile(profile: AuthProfileRow | null) {
  if (!profile) {
    return null
  }

  return {
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    profession: profile.profession,
    city: profile.city,
    bio: profile.bio,
    mainBranchId: profile.mainBranchId ?? undefined,
  }
}

const loginQueueByPhone = new Map<string, Promise<void>>()

async function withPhoneQueue<T>(phone: string, task: () => Promise<T>) {
  const previous = loginQueueByPhone.get(phone) ?? Promise.resolve()
  let release: () => void = () => undefined

  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queue = previous.then(() => current, () => current)

  loginQueueByPhone.set(phone, queue)

  await previous.catch(() => undefined)

  try {
    return await task()
  } finally {
    release()
    if (loginQueueByPhone.get(phone) === queue) {
      loginQueueByPhone.delete(phone)
    }
  }
}

async function findUserForLogin(prisma: PrismaClient, phone: string): Promise<AuthUserRow | null> {
  return (await prisma.user.findUnique({
    where: { phone },
    include: { profile: true },
  })) as AuthUserRow | null
}

type BlankWorldInput = {
  userId?: string
  phone: string
  passwordHash: string
  nickname?: string | null
  avatarUrl?: string | null
}

async function createBlankUserWorld(prisma: PrismaClient, input: BlankWorldInput) {
  const existingUser = input.userId
    ? await prisma.user.findUnique({
        where: { id: input.userId },
        include: { profile: true },
      })
    : await findUserForLogin(prisma, input.phone)

  if (existingUser?.profile) {
    return existingUser as AuthUserRow
  }

  const userId = existingUser?.id ?? input.userId ?? makeId('user')
  const now = Date.now()
  const nickname = input.nickname?.trim() || existingUser?.nickname?.trim() || '未命名用户'
  const avatarUrl = input.avatarUrl ?? existingUser?.avatarUrl ?? null
  const phone = input.phone.trim()

  await prisma.$transaction(async (tx) => {
    if (existingUser) {
      await tx.user.update({
        where: { id: userId },
        data: {
          phone,
          passwordHash: input.passwordHash,
          nickname,
          avatarUrl,
          updatedAt: now,
        },
      })

      if (!existingUser.profile) {
        await tx.momentLike.deleteMany({ where: { userId } })
        await tx.momentComment.deleteMany({ where: { userId } })
        await tx.message.deleteMany({ where: { userId } })
        await tx.moment.deleteMany({ where: { userId } })
        await tx.branch.deleteMany({ where: { userId } })
        await tx.fileRecord.deleteMany({ where: { userId } })
        await tx.aiJob.deleteMany({ where: { userId } })
      }
    } else {
      await tx.user.create({
        data: {
          id: userId,
          phone,
          passwordHash: input.passwordHash,
          nickname,
          avatarUrl,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      })
    }

    await tx.userProfile.upsert({
      where: { userId },
      create: {
        id: makeId('profile'),
        userId,
        name: nickname,
        gender: '男',
        age: 18,
        profession: '未设置',
        city: '未设置',
        bio: '这个账号还没有填写个人资料。',
        mainBranchId: null,
        updatedAt: now,
      },
      update: {
        name: nickname,
        gender: '男',
        age: 18,
        profession: '未设置',
        city: '未设置',
        bio: '这个账号还没有填写个人资料。',
        mainBranchId: null,
        updatedAt: now,
      },
    })
  })

  return (await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })) as AuthUserRow | null
}

export function createPublicAuthRouter(prisma: PrismaClient = defaultPrisma) {
  const router = Router()

  router.post(
    '/login',
    asyncRoute(async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>
      const phone = readText(body.phone)
      const password = readText(body.password)

      if (!phone || !password) {
        return res.status(400).json({ message: 'phone 和 password 不能为空' })
      }

      return withPhoneQueue(phone, async () => {
        const user = await findUserForLogin(prisma, phone)

        if (!user) {
          return res.status(404).json({ message: '账号不存在，请先注册' })
        }

        if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
          return res.status(401).json({ message: '手机号或密码错误' })
        }

        const nextUser = user.profile
          ? user
          : await createBlankUserWorld(prisma, {
              userId: user.id,
              phone,
              passwordHash: user.passwordHash,
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            })

        if (!nextUser || !nextUser.profile) {
          return res.status(500).json({ message: '账号初始化失败，请重试' })
        }

        const token = await createSession(prisma, nextUser.id)

        res.json({
          token,
          isNewUser: false,
          user: toAuthUser(nextUser),
          profile: toProfile(nextUser.profile),
        })
      })
    }),
  )

  router.post(
    '/register',
    asyncRoute(async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>
      const phone = readText(body.phone)
      const password = readText(body.password)

      if (!phone || !password) {
        return res.status(400).json({ message: 'phone 和 password 不能为空' })
      }

      return withPhoneQueue(phone, async () => {
        const user = await findUserForLogin(prisma, phone)
        if (user) {
          return res.status(409).json({ message: '手机号已注册，请直接登录' })
        }

        const created = await createBlankUserWorld(prisma, {
          phone,
          passwordHash: hashPassword(password),
        })

        if (!created || !created.profile) {
          return res.status(500).json({ message: '账号创建失败，请重试' })
        }

        const token = await createSession(prisma, created.id)

        res.status(201).json({
          token,
          isNewUser: true,
          user: toAuthUser(created),
          profile: toProfile(created.profile),
        })
      })
    }),
  )

  return router
}

export function createProtectedAuthRouter(prisma: PrismaClient = defaultPrisma) {
  const router = Router()

  router.get(
    '/me',
    asyncRoute(async (_req, res) => {
      const auth = getAuthContext()
      if (!auth) {
        return res.status(401).json({ message: '请先登录' })
      }

      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        include: { profile: true },
      })

      if (!user || !user.profile) {
        return res.status(404).json({ message: '用户不存在' })
      }

      res.json({
        user: toAuthUser(user),
        profile: toProfile(user.profile),
      })
    }),
  )

  router.post(
    '/logout',
    asyncRoute(async (_req, res) => {
      const auth = getAuthContext()
      if (!auth) {
        return res.status(401).json({ message: '请先登录' })
      }

      await revokeSession(prisma, auth.token)
      res.json({ ok: true })
    }),
  )

  return router
}
