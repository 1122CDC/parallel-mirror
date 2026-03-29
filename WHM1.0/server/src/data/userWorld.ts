import type { PrismaClient } from '@prisma/client'
import { createSeedState } from './seed'
import { makeId } from '../utils/id'

type SeedUserWorldInput = {
  userId?: string
  phone: string
  passwordHash: string
  nickname?: string
  avatarUrl?: string | null
}

function getBranchIdMap() {
  const seed = createSeedState()
  const branchIdMap = new Map<string, string>()

  for (const branch of seed.branches) {
    branchIdMap.set(branch.id, makeId('br'))
  }

  return {
    seed,
    branchIdMap,
    mainBranchId: branchIdMap.get('origin') ?? null,
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

async function reloadSeededUser(prisma: PrismaClient, userId: string | undefined, phone: string) {
  if (userId) {
    const byId = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (byId?.profile) {
      return byId
    }
  }

  return prisma.user.findUnique({
    where: { phone },
    include: { profile: true },
  })
}

export async function seedUserWorld(prisma: PrismaClient, input: SeedUserWorldInput) {
  const existingUser = input.userId
    ? await prisma.user.findUnique({
        where: { id: input.userId },
        include: { profile: true },
      })
    : await prisma.user.findUnique({
        where: { phone: input.phone },
        include: { profile: true },
      })

  if (existingUser?.profile) {
    return existingUser
  }

  const userId = existingUser?.id ?? input.userId ?? makeId('user')
  const now = Date.now()
  const { seed, branchIdMap, mainBranchId } = getBranchIdMap()
  const momentIdMap = new Map<string, string>()

  for (const moment of seed.moments) {
    momentIdMap.set(moment.id, makeId('mo'))
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (!existingUser) {
        await tx.user.create({
          data: {
            id: userId,
            phone: input.phone,
            passwordHash: input.passwordHash,
            nickname: input.nickname ?? seed.profile.name,
            avatarUrl: input.avatarUrl ?? null,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          },
        })
      } else {
        await tx.user.update({
          where: { id: userId },
          data: {
            phone: input.phone,
            passwordHash: input.passwordHash,
            nickname: input.nickname ?? existingUser.nickname ?? seed.profile.name,
            avatarUrl: input.avatarUrl ?? existingUser.avatarUrl ?? null,
            updatedAt: now,
          },
        })
      }

      await tx.userProfile.create({
        data: {
          id: makeId('profile'),
          userId,
          name: seed.profile.name,
          gender: seed.profile.gender,
          age: seed.profile.age,
          profession: seed.profile.profession,
          city: seed.profile.city,
          bio: seed.profile.bio,
          mainBranchId,
          updatedAt: now,
        },
      })

      await tx.branch.createMany({
        data: seed.branches.map((branch) => ({
          id: branchIdMap.get(branch.id) ?? makeId('br'),
          userId,
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

      await tx.message.createMany({
        data: seed.messages.map((message) => ({
          id: makeId('msg'),
          userId,
          branchId: branchIdMap.get(message.partnerId) ?? message.partnerId,
          senderType: message.isMe ? 'me' : 'branch',
          content: message.text,
          contentType: 'text',
          isRead: false,
          timestamp: message.timestamp,
        })),
      })

      await tx.moment.createMany({
        data: seed.moments.map((moment) => ({
          id: momentIdMap.get(moment.id) ?? makeId('mo'),
          userId,
          branchId: branchIdMap.get(moment.branchId) ?? moment.branchId,
          content: moment.content,
          imageUrl: moment.imageUrl,
          timestamp: moment.timestamp,
          createdAt: moment.timestamp,
          updatedAt: moment.timestamp,
        })),
      })

      for (const moment of seed.moments) {
        const remappedMomentId = momentIdMap.get(moment.id)
        if (!remappedMomentId) {
          continue
        }

        for (const comment of moment.comments) {
          await tx.momentComment.create({
            data: {
              id: makeId('comment'),
              momentId: remappedMomentId,
              userId,
              branchId: branchIdMap.get(moment.branchId) ?? moment.branchId,
              userName: comment.userName,
              content: comment.text,
              timestamp: moment.timestamp + 1,
            },
          })
        }

        for (const userName of moment.likes) {
          await tx.momentLike.create({
            data: {
              id: makeId('like'),
              momentId: remappedMomentId,
              userId,
              userName,
              timestamp: moment.timestamp + 1,
            },
          })
        }
      }
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error
    }

    const reloaded = await reloadSeededUser(prisma, existingUser?.id ?? input.userId ?? userId, input.phone)
    if (reloaded?.profile) {
      return reloaded
    }

    throw error
  }

  return reloadSeededUser(prisma, existingUser?.id ?? input.userId ?? userId, input.phone)
}
