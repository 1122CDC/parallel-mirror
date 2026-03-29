import type { Prisma, PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { env } from '../config/env'
import { getAdminAuthContext } from '../admin/context'
import { createAdminAuthMiddleware } from '../admin/middleware'
import { createAdminToken, verifyAdminCredentials } from '../admin/session'
import { asyncRoute } from '../utils/asyncRoute'
import { readText } from '../utils/http'

type AdminProfileRow = {
  name: string
  gender: string
  age: number
  profession: string
  city: string
  bio: string
  mainBranchId: string | null
  updatedAt: number
}

type AdminBranchCoreRow = {
  id: string
  userId: string
  branchNumber: string
  name: string
  profession: string
  workplace: string
  world: string
  icon: string
  color: string
  bio: string
  coverUrl: string
  status: string
  sourceYear: string | null
  sourceDesc: string | null
  timestamp: number
  createdAt: number
  updatedAt: number
  _count: {
    moments: number
    messages: number
  }
}

type AdminUserMiniRow = {
  id: string
  phone: string | null
  nickname: string | null
  avatarUrl: string | null
  status: string
  createdAt: number
  updatedAt: number
}

type AdminUserSummaryRow = AdminUserMiniRow & {
  profile: AdminProfileRow | null
  branches: AdminBranchCoreRow[]
  _count: {
    branches: number
    moments: number
    messages: number
    files: number
    aiJobs: number
  }
}

type AdminMomentRow = {
  id: string
  branchId: string
  content: string
  imageUrl: string | null
  timestamp: number
  createdAt: number
  updatedAt: number
  comments: Array<{
    id: string
    momentId: string
    userId: string
    branchId: string | null
    userName: string
    content: string
    timestamp: number
  }>
  likes: Array<{
    id: string
    momentId: string
    userId: string
    userName: string
    timestamp: number
  }>
}

type AdminMessageRow = {
  id: string
  branchId: string
  senderType: string
  content: string
  contentType: string
  isRead: boolean
  timestamp: number
}

type AdminFileRow = {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  size: number
  source: string
  timestamp: number
}

type AdminAiJobRow = {
  id: string
  jobType: string
  prompt: string
  status: string
  resultJson: string | null
  errorMsg: string | null
  createdAt: number
  completedAt: number | null
}

type AdminUserDetailRow = AdminUserMiniRow & {
  profile: AdminProfileRow | null
  branches: AdminBranchCoreRow[]
  moments: AdminMomentRow[]
  messages: AdminMessageRow[]
  files: AdminFileRow[]
  aiJobs: AdminAiJobRow[]
  _count: {
    branches: number
    moments: number
    messages: number
    files: number
    aiJobs: number
  }
}

type AdminBranchListRow = AdminBranchCoreRow & {
  user: AdminUserMiniRow & {
    profile: AdminProfileRow | null
    _count: {
      branches: number
    }
  }
}

type AdminBranchDetailRow = AdminBranchCoreRow & {
  user: AdminUserMiniRow & {
    profile: AdminProfileRow | null
    _count: {
      branches: number
    }
  }
  moments: AdminMomentRow[]
  messages: AdminMessageRow[]
}

function readQueryText(value: unknown) {
  if (Array.isArray(value)) {
    return readText(value[0])
  }

  return readText(value)
}

function readQueryInt(value: unknown, fallback: number, min = 1, max = 100) {
  const text = readQueryText(value)
  if (!text) return fallback

  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return fallback

  const normalized = Math.floor(parsed)
  return Math.min(max, Math.max(min, normalized))
}

function mapProfile(profile: AdminProfileRow | null) {
  if (!profile) return null

  return {
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    profession: profile.profession,
    city: profile.city,
    bio: profile.bio,
    mainBranchId: profile.mainBranchId,
    updatedAt: profile.updatedAt,
  }
}

function mapBranchCore(branch: AdminBranchCoreRow) {
  return {
    id: branch.id,
    userId: branch.userId,
    branchNumber: branch.branchNumber,
    name: branch.name,
    profession: branch.profession,
    workplace: branch.workplace,
    world: branch.world,
    icon: branch.icon,
    color: branch.color,
    bio: branch.bio,
    coverUrl: branch.coverUrl,
    status: branch.status,
    sourceYear: branch.sourceYear,
    sourceDescription: branch.sourceDesc,
    timestamp: branch.timestamp,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
    momentCount: branch._count.moments,
    messageCount: branch._count.messages,
  }
}

function mapUserMini(user: AdminUserMiniRow) {
  return {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function mapMoment(moment: AdminMomentRow) {
  return {
    id: moment.id,
    branchId: moment.branchId,
    content: moment.content,
    imageUrl: moment.imageUrl,
    timestamp: moment.timestamp,
    createdAt: moment.createdAt,
    updatedAt: moment.updatedAt,
    comments: moment.comments.map((comment) => ({
      id: comment.id,
      momentId: comment.momentId,
      userId: comment.userId,
      branchId: comment.branchId,
      userName: comment.userName,
      content: comment.content,
      timestamp: comment.timestamp,
    })),
    likes: moment.likes.map((like) => ({
      id: like.id,
      momentId: like.momentId,
      userId: like.userId,
      userName: like.userName,
      timestamp: like.timestamp,
    })),
  }
}

function mapMessage(message: AdminMessageRow) {
  return {
    id: message.id,
    branchId: message.branchId,
    senderType: message.senderType,
    content: message.content,
    contentType: message.contentType,
    isRead: message.isRead,
    timestamp: message.timestamp,
  }
}

function mapFile(file: AdminFileRow) {
  return {
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    mimeType: file.mimeType,
    size: file.size,
    source: file.source,
    timestamp: file.timestamp,
  }
}

function mapAiJob(job: AdminAiJobRow) {
  return {
    id: job.id,
    jobType: job.jobType,
    prompt: job.prompt,
    status: job.status,
    resultJson: job.resultJson,
    errorMsg: job.errorMsg,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  }
}

function mapUserSummary(user: AdminUserSummaryRow) {
  return {
    ...mapUserMini(user),
    profile: mapProfile(user.profile),
    branchCount: user._count.branches,
    momentCount: user._count.moments,
    messageCount: user._count.messages,
    fileCount: user._count.files,
    aiJobCount: user._count.aiJobs,
    latestBranch: user.branches[0] ? mapBranchCore(user.branches[0]) : null,
  }
}

function mapUserDetail(user: AdminUserDetailRow) {
  return {
    user: mapUserMini(user),
    profile: mapProfile(user.profile),
    stats: {
      branches: user._count.branches,
      moments: user._count.moments,
      messages: user._count.messages,
      files: user._count.files,
      aiJobs: user._count.aiJobs,
    },
    branches: user.branches.map(mapBranchCore),
    moments: user.moments.map(mapMoment),
    messages: user.messages.map(mapMessage),
    files: user.files.map(mapFile),
    aiJobs: user.aiJobs.map(mapAiJob),
  }
}

function mapBranchListItem(branch: AdminBranchListRow) {
  return {
    branch: mapBranchCore(branch),
    user: mapUserMini(branch.user),
    profile: mapProfile(branch.user.profile),
    userBranchCount: branch.user._count.branches,
  }
}

function mapBranchDetail(branch: AdminBranchDetailRow) {
  return {
    branch: mapBranchCore(branch),
    user: mapUserMini(branch.user),
    profile: mapProfile(branch.user.profile),
    userBranchCount: branch.user._count.branches,
    stats: {
      moments: branch._count.moments,
      messages: branch._count.messages,
    },
    moments: branch.moments.map(mapMoment),
    messages: branch.messages.map(mapMessage),
  }
}

function buildUserWhere(query: Record<string, unknown>): Prisma.UserWhereInput {
  const keyword = readQueryText(query.q)
  const status = readQueryText(query.status)
  const where: Prisma.UserWhereInput = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (keyword) {
    where.OR = [
      { id: { contains: keyword } },
      { phone: { contains: keyword } },
      { nickname: { contains: keyword } },
      {
        profile: {
          is: {
            OR: [
              { name: { contains: keyword } },
              { profession: { contains: keyword } },
              { city: { contains: keyword } },
            ],
          },
        },
      },
      {
        branches: {
          some: {
            OR: [
              { id: { contains: keyword } },
              { branchNumber: { contains: keyword } },
              { name: { contains: keyword } },
              { profession: { contains: keyword } },
              { workplace: { contains: keyword } },
              { world: { contains: keyword } },
              { sourceYear: { contains: keyword } },
              { sourceDesc: { contains: keyword } },
            ],
          },
        },
      },
    ]
  }

  return where
}

function buildBranchWhere(query: Record<string, unknown>): Prisma.BranchWhereInput {
  const keyword = readQueryText(query.q)
  const status = readQueryText(query.status)
  const userId = readQueryText(query.userId)
  const where: Prisma.BranchWhereInput = {}

  if (userId) {
    where.userId = userId
  }

  if (status && status !== 'all') {
    where.status = status
  }

  if (keyword) {
    where.OR = [
      { id: { contains: keyword } },
      { branchNumber: { contains: keyword } },
      { name: { contains: keyword } },
      { profession: { contains: keyword } },
      { workplace: { contains: keyword } },
      { world: { contains: keyword } },
      { sourceYear: { contains: keyword } },
      { sourceDesc: { contains: keyword } },
      {
        user: {
          is: {
            OR: [
              { id: { contains: keyword } },
              { phone: { contains: keyword } },
              { nickname: { contains: keyword } },
              {
                profile: {
                  is: {
                    OR: [
                      { name: { contains: keyword } },
                      { profession: { contains: keyword } },
                      { city: { contains: keyword } },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ]
  }

  return where
}

function buildPageMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export function createAdminRouter(prisma: PrismaClient) {
  const router = Router()

  router.post(
    '/login',
    asyncRoute(async (req, res) => {
      const body = req.body as Record<string, unknown>
      const username = readText(body.username)
      const password = readText(body.password)

      if (!username || !password) {
        return res.status(400).json({ message: 'username 和 password 不能为空' })
      }

      if (!verifyAdminCredentials(username, password)) {
        return res.status(401).json({ message: '管理员账号或密码错误' })
      }

      const token = createAdminToken({
        username: env.adminUsername,
        displayName: env.adminDisplayName,
      })

      res.json({
        token,
        admin: {
          username: env.adminUsername,
          displayName: env.adminDisplayName,
        },
      })
    }),
  )

  router.use(createAdminAuthMiddleware())

  router.get(
    '/me',
    asyncRoute(async (_req, res) => {
      const auth = getAdminAuthContext()

      if (!auth) {
        return res.status(401).json({ message: '请先登录管理员账号' })
      }

      res.json({
        admin: {
          username: auth.username,
          displayName: auth.displayName,
        },
      })
    }),
  )

  router.post(
    '/logout',
    asyncRoute(async (_req, res) => {
      res.json({ ok: true })
    }),
  )

  router.get(
    '/stats',
    asyncRoute(async (_req, res) => {
      const [userCount, branchCount, momentCount, messageCount, fileCount, aiJobCount] =
        await Promise.all([
          prisma.user.count(),
          prisma.branch.count(),
          prisma.moment.count(),
          prisma.message.count(),
          prisma.fileRecord.count(),
          prisma.aiJob.count(),
        ])

      res.json({
        userCount,
        branchCount,
        momentCount,
        messageCount,
        fileCount,
        aiJobCount,
      })
    }),
  )

  router.get(
    '/users',
    asyncRoute(async (req, res) => {
      const page = readQueryInt(req.query.page, 1, 1, 100000)
      const pageSize = readQueryInt(req.query.pageSize, 10, 1, 50)
      const where = buildUserWhere(req.query as Record<string, unknown>)

      const [total, rows] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            profile: true,
            branches: {
              orderBy: { timestamp: 'desc' },
              take: 1,
              include: {
                _count: {
                  select: {
                    moments: true,
                    messages: true,
                  },
                },
              },
            },
            _count: {
              select: {
                branches: true,
                moments: true,
                messages: true,
                files: true,
                aiJobs: true,
              },
            },
          },
        }),
      ])

      res.json({
        ...buildPageMeta(total, page, pageSize),
        items: (rows as AdminUserSummaryRow[]).map(mapUserSummary),
      })
    }),
  )

  router.get(
    '/users/:id',
    asyncRoute(async (req, res) => {
      const userId = String(req.params.id)
      const user = (await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          branches: {
            orderBy: { timestamp: 'desc' },
            include: {
              _count: {
                select: {
                  moments: true,
                  messages: true,
                },
              },
            },
          },
          moments: {
            orderBy: { timestamp: 'desc' },
            include: {
              comments: true,
              likes: true,
            },
          },
          messages: {
            orderBy: { timestamp: 'desc' },
          },
          files: {
            orderBy: { timestamp: 'desc' },
          },
          aiJobs: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              branches: true,
              moments: true,
              messages: true,
              files: true,
              aiJobs: true,
            },
          },
        },
      })) as AdminUserDetailRow | null

      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      res.json(mapUserDetail(user))
    }),
  )

  router.get(
    '/branches',
    asyncRoute(async (req, res) => {
      const page = readQueryInt(req.query.page, 1, 1, 100000)
      const pageSize = readQueryInt(req.query.pageSize, 10, 1, 50)
      const where = buildBranchWhere(req.query as Record<string, unknown>)

      const [total, rows] = await Promise.all([
        prisma.branch.count({ where }),
        prisma.branch.findMany({
          where,
          orderBy: [{ updatedAt: 'desc' }, { timestamp: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: {
              include: {
                profile: true,
                _count: {
                  select: {
                    branches: true,
                  },
                },
              },
            },
            _count: {
              select: {
                moments: true,
                messages: true,
              },
            },
          },
        }),
      ])

      const items = (rows as AdminBranchListRow[]).map(mapBranchListItem)

      res.json({
        ...buildPageMeta(total, page, pageSize),
        items,
      })
    }),
  )

  router.get(
    '/branches/:id',
    asyncRoute(async (req, res) => {
      const branchId = String(req.params.id)
      const branch = (await prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          user: {
            include: {
              profile: true,
              _count: {
                select: {
                  branches: true,
                },
              },
            },
          },
          moments: {
            orderBy: { timestamp: 'desc' },
            include: {
              comments: true,
              likes: true,
            },
          },
          messages: {
            orderBy: { timestamp: 'desc' },
          },
          _count: {
            select: {
              moments: true,
              messages: true,
            },
          },
        },
      })) as AdminBranchDetailRow | null

      if (!branch) {
        return res.status(404).json({ message: '支线不存在' })
      }

      res.json({
        branch: mapBranchCore(branch),
        user: mapUserMini(branch.user),
        profile: mapProfile(branch.user.profile),
        userBranchCount: branch.user._count.branches,
        stats: {
          moments: branch._count.moments,
          messages: branch._count.messages,
        },
        moments: branch.moments.map(mapMoment),
        messages: branch.messages.map(mapMessage),
      })
    }),
  )

  return router
}
