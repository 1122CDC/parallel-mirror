import type { Prisma, PrismaClient } from '@prisma/client'
import { createSeedState } from './seed'

export const DEFAULT_USER_ID = 'default-user'

type SeedOptions = {
  reset?: boolean
}

export async function seedPrismaDatabase(prisma: PrismaClient, options: SeedOptions = {}) {
  const seed = createSeedState()
  const shouldReset = options.reset === true

  if (shouldReset) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.authSession.deleteMany().catch(() => undefined)
      await tx.momentLike.deleteMany()
      await tx.momentComment.deleteMany()
      await tx.message.deleteMany()
      await tx.moment.deleteMany()
      await tx.fileRecord.deleteMany()
      await tx.branch.deleteMany()
      await tx.userProfile.deleteMany()
      await tx.aiJob.deleteMany()
      await tx.user.deleteMany()
    })
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
    select: { id: true },
  })

  if (existingUser && !shouldReset) {
    return
  }

  const now = Date.now()

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.create({
      data: {
        id: DEFAULT_USER_ID,
        phone: null,
        passwordHash: null,
        nickname: seed.profile.name,
        avatarUrl: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    })

    await tx.userProfile.create({
      data: {
        id: 'profile_default',
        userId: DEFAULT_USER_ID,
        name: seed.profile.name,
        gender: seed.profile.gender,
        age: seed.profile.age,
        profession: seed.profile.profession,
        city: seed.profile.city,
        bio: seed.profile.bio,
        mainBranchId: null,
        updatedAt: now,
      },
    })

    if (seed.branches.length > 0) {
      await tx.branch.createMany({
        data: seed.branches.map((branch) => ({
          id: branch.id,
          userId: DEFAULT_USER_ID,
          branchNumber: branch.branchNumber,
          name: branch.name,
          profession: branch.profession,
          workplace: branch.workplace,
          world: branch.world,
          icon: branch.icon,
          color: branch.color,
          bio: branch.bio,
          coverUrl: branch.cover,
          status: branch.status,
          sourceYear: null,
          sourceDesc: null,
          timestamp: branch.timestamp,
          createdAt: branch.timestamp,
          updatedAt: branch.timestamp,
        })),
      })
    }

    if (seed.messages.length > 0) {
      await tx.message.createMany({
        data: seed.messages.map((message) => ({
          id: message.id,
          userId: DEFAULT_USER_ID,
          branchId: message.partnerId,
          senderType: message.isMe ? 'me' : 'branch',
          content: message.text,
          contentType: 'text',
          isRead: false,
          timestamp: message.timestamp,
        })),
      })
    }

    if (seed.moments.length > 0) {
      await tx.moment.createMany({
        data: seed.moments.map((moment) => ({
          id: moment.id,
          userId: DEFAULT_USER_ID,
          branchId: moment.branchId,
          content: moment.content,
          imageUrl: moment.imageUrl,
          timestamp: moment.timestamp,
          createdAt: moment.timestamp,
          updatedAt: moment.timestamp,
        })),
      })
    }

    for (const moment of seed.moments) {
      for (const comment of moment.comments) {
        await tx.momentComment.create({
          data: {
            id: `comment_${moment.id}_${comment.userName.replace(/\s+/g, '_')}_${Math.random().toString(16).slice(2, 8)}`,
            momentId: moment.id,
            userId: DEFAULT_USER_ID,
            branchId: null,
            userName: comment.userName,
            content: comment.text,
            timestamp: moment.timestamp + 1,
          },
        })
      }

      for (const userName of moment.likes) {
        await tx.momentLike.create({
          data: {
            id: `like_${moment.id}_${userName.replace(/\s+/g, '_')}_${Math.random().toString(16).slice(2, 8)}`,
            momentId: moment.id,
            userId: DEFAULT_USER_ID,
            userName,
            timestamp: moment.timestamp + 1,
          },
        })
      }
    }
  })
}
