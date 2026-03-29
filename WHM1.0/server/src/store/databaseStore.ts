import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from '../db/client'
import { seedPrismaDatabase, DEFAULT_USER_ID } from '../data/bootstrap'
import { getCurrentUserId } from '../auth/context'
import { createSeedState } from '../data/seed'
import { buildBranchPreview as buildPreviewFromPrompt } from '../utils/branchPreview'
import { generateChatReply, generateMomentCommentReply, generateMomentDraft } from '../utils/aiInteractions'
import { buildBranchCoverUrl } from '../utils/cover'
import { buildBranchReply } from '../utils/branchReply'
import { makeId } from '../utils/id'
import type {
  AppStore,
  CreateFileRecordInput,
  CreateMomentInput,
  GenerateMomentDraftInput,
  GenerateReplyInput,
  SendMessageResult,
  UpdateBranchInput,
} from './contracts'
import type {
  BranchPreview,
  BranchProfile,
  ChatMessage,
  MomentComment,
  MomentPost,
  UploadedFileRecord,
  UserProfile,
} from '../types/domain'

type BranchRow = {
  id: string
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
  timestamp: number
}

type MessageRow = {
  id: string
  branchId: string
  senderType: string
  content: string
  timestamp: number
}

type MomentCommentRow = {
  id: string
  momentId: string
  userName: string
  content: string
  timestamp: number
}

type MomentLikeRow = {
  id: string
  momentId: string
  userName: string
  timestamp: number
}

type MomentRow = {
  id: string
  branchId: string
  content: string
  imageUrl: string | null
  timestamp: number
  comments: MomentCommentRow[]
  likes: MomentLikeRow[]
}

type FileRecordRow = {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  size: number
  timestamp: number
}

type ProfileDraft = {
  name: string
  gender: UserProfile['gender']
  age: number
  profession: string
  city: string
  bio: string
  mainBranchId?: string
}

const fallbackProfile = createSeedState().profile

function toBranchProfile(branch: BranchRow): BranchProfile {
  return {
    id: branch.id,
    branchNumber: branch.branchNumber,
    name: branch.name,
    profession: branch.profession,
    workplace: branch.workplace,
    world: branch.world,
    icon: branch.icon,
    color: branch.color,
    bio: branch.bio,
    cover: branch.coverUrl,
    status: branch.status === 'syncing' ? 'syncing' : 'ready',
    timestamp: branch.timestamp,
  }
}

function toChatMessage(message: MessageRow): ChatMessage {
  return {
    id: message.id,
    partnerId: message.branchId,
    text: message.content,
    isMe: message.senderType === 'me',
    timestamp: message.timestamp,
  }
}

function toMomentComment(comment: MomentCommentRow): MomentComment {
  return {
    userName: comment.userName,
    text: comment.content,
  }
}

function toMomentPost(moment: MomentRow): MomentPost {
  return {
    id: moment.id,
    branchId: moment.branchId,
    content: moment.content,
    imageUrl: moment.imageUrl,
    timestamp: moment.timestamp,
    likes: moment.likes
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((like) => like.userName),
    comments: moment.comments
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(toMomentComment),
  }
}

function toFileRecord(file: FileRecordRow): UploadedFileRecord {
  return {
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    mimeType: file.mimeType,
    size: file.size,
    source: 'upload',
    timestamp: file.timestamp,
  }
}

function toUserProfile(profile: { name: string; gender: string; age: number; profession: string; city: string; bio: string }): UserProfile {
  return {
    name: profile.name,
    gender: profile.gender as UserProfile['gender'],
    age: profile.age,
    profession: profile.profession,
    city: profile.city,
    bio: profile.bio,
  }
}

function assignDefined(target: Record<string, unknown>, payload: Record<string, unknown>) {
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      target[key] = value
    }
  }
}

export class DatabaseStore implements AppStore {
  private constructor(private readonly prisma: PrismaClient) {}

  private get userId() {
    return getCurrentUserId()
  }

  private async getMainBranchId() {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: this.userId },
      select: { mainBranchId: true },
    })

    return profile?.mainBranchId ?? 'origin'
  }

  static async create(prismaClient: PrismaClient = defaultPrisma) {
    const store = new DatabaseStore(prismaClient)

    if (process.env.NODE_ENV !== 'production') {
      const userCount = await prismaClient.user.count({
        where: { id: DEFAULT_USER_ID },
      })

      if (userCount === 0) {
        await seedPrismaDatabase(prismaClient)
      }
    }

    return store
  }

  async reset() {
    await seedPrismaDatabase(this.prisma, { reset: true })
  }

  async getProfile() {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: this.userId },
    })

    return profile ? toUserProfile(profile) : { ...fallbackProfile }
  }

  async updateProfile(payload: Partial<UserProfile>) {
    const now = Date.now()
    const current = await this.prisma.userProfile.findUnique({
      where: { userId: this.userId },
    })

    const next: ProfileDraft = current
      ? {
          name: current.name,
          gender: current.gender as UserProfile['gender'],
          age: current.age,
          profession: current.profession,
          city: current.city,
          bio: current.bio,
          mainBranchId: current.mainBranchId ?? 'origin',
        }
      : {
          name: fallbackProfile.name,
          gender: fallbackProfile.gender,
          age: fallbackProfile.age,
          profession: fallbackProfile.profession,
          city: fallbackProfile.city,
          bio: fallbackProfile.bio,
          mainBranchId: 'origin',
        }

    assignDefined(next as unknown as Record<string, unknown>, payload as unknown as Record<string, unknown>)

    const profile = await this.prisma.userProfile.upsert({
      where: { userId: this.userId },
      create: {
        id: 'profile_default',
        userId: this.userId,
        name: next.name,
        gender: next.gender,
        age: next.age,
        profession: next.profession,
        city: next.city,
        bio: next.bio,
        mainBranchId: next.mainBranchId ?? 'origin',
        updatedAt: now,
      },
      update: {
        name: next.name,
        gender: next.gender,
        age: next.age,
        profession: next.profession,
        city: next.city,
        bio: next.bio,
        mainBranchId: next.mainBranchId ?? 'origin',
        updatedAt: now,
      },
    })

    await this.prisma.user.update({
      where: { id: this.userId },
      data: {
        nickname: profile.name,
        updatedAt: now,
      },
    })

    const mainBranchId = next.mainBranchId ?? 'origin'

    await this.prisma.branch.updateMany({
      where: { id: mainBranchId, userId: this.userId },
      data: {
        profession: profile.profession,
        workplace: profile.city,
        bio: profile.bio,
        updatedAt: now,
      },
    })

    return toUserProfile(profile)
  }

  async listBranches() {
    const branches = (await this.prisma.branch.findMany({
      where: { userId: this.userId },
      orderBy: { timestamp: 'desc' },
    })) as BranchRow[]

    return branches.map((branch) => toBranchProfile(branch))
  }

  async getBranchById(id: string) {
    const branch = (await this.prisma.branch.findFirst({
      where: { id, userId: this.userId },
    })) as BranchRow | null

    return branch ? toBranchProfile(branch) : null
  }

  async listChatCards() {
    const branches = await this.listBranches()
    return Promise.all(
      branches.map(async (branch) => ({
        branch,
        lastMessage: await this.getLatestMessage(branch.id),
      })),
    )
  }

  async getMessagesByPartnerId(partnerId: string) {
    const messages = (await this.prisma.message.findMany({
      where: {
        userId: this.userId,
        branchId: partnerId,
      },
      orderBy: { timestamp: 'asc' },
    })) as MessageRow[]

    return messages.map((message) => toChatMessage(message))
  }

  async getLatestMessage(partnerId: string) {
    const message = (await this.prisma.message.findFirst({
      where: {
        userId: this.userId,
        branchId: partnerId,
      },
      orderBy: { timestamp: 'desc' },
    })) as MessageRow | null

    return message ? toChatMessage(message) : null
  }

  async sendMessage(partnerId: string, text: string): Promise<SendMessageResult | null> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: partnerId, userId: this.userId },
    })

    if (!branch) return null

    const timestamp = Date.now()
    const userMessageId = makeId('msg')
    const userMessage: ChatMessage = {
      id: userMessageId,
      partnerId,
      text,
      isMe: true,
      timestamp,
    }

    await this.prisma.message.create({
      data: {
        id: userMessageId,
        userId: this.userId,
        branchId: partnerId,
        senderType: 'me',
        content: text,
        contentType: 'text',
        isRead: false,
        timestamp,
      },
    })

    let replyMessage: ChatMessage | null = null
    const mainBranchId = await this.getMainBranchId()
    if (partnerId !== mainBranchId) {
      const replyText = `收到，我在${branch.workplace}。`
      const replyMessageId = makeId('msg')
      replyMessage = {
        id: replyMessageId,
        partnerId,
        text: replyText,
        isMe: false,
        timestamp: timestamp + 1,
      }

      await this.prisma.message.create({
        data: {
          id: replyMessageId,
          userId: this.userId,
          branchId: partnerId,
          senderType: 'branch',
          content: replyText,
          contentType: 'text',
          isRead: false,
          timestamp: timestamp + 1,
        },
      })
    }

    return {
      userMessage,
      replyMessage,
      messages: replyMessage ? [userMessage, replyMessage] : [userMessage],
    }
  }

  async listMoments() {
    const moments = (await this.prisma.moment.findMany({
      where: { userId: this.userId },
      include: {
        comments: true,
        likes: true,
      },
      orderBy: { timestamp: 'desc' },
    })) as MomentRow[]

    return moments.map((moment) => toMomentPost(moment))
  }

  async getMomentById(id: string) {
    const moment = (await this.prisma.moment.findFirst({
      where: { id, userId: this.userId },
      include: {
        comments: true,
        likes: true,
      },
    })) as MomentRow | null

    return moment ? toMomentPost(moment) : null
  }

  async createMoment(input: CreateMomentInput) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: input.branchId, userId: this.userId },
      select: { id: true },
    })

    if (!branch) return null

    const timestamp = Date.now()
    const moment = (await this.prisma.moment.create({
      data: {
        id: makeId('mo'),
        userId: this.userId,
        branchId: input.branchId,
        content: input.content,
        imageUrl: input.imageUrl ?? null,
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      include: {
        comments: true,
        likes: true,
      },
    })) as MomentRow

    return toMomentPost(moment)
  }

  async toggleLike(momentId: string, userName = '未命名用户') {
    const moment = (await this.prisma.moment.findFirst({
      where: { id: momentId, userId: this.userId },
      select: { id: true },
    })) as { id: string } | null

    if (!moment) return null

    const existing = await this.prisma.momentLike.findFirst({
      where: {
        momentId,
        userName,
      },
    })

    if (existing) {
      await this.prisma.momentLike.delete({
        where: {
          id: existing.id,
        },
      })
    } else {
      await this.prisma.momentLike.create({
        data: {
          id: makeId('like'),
          momentId,
          userId: this.userId,
          userName,
          timestamp: Date.now(),
        },
      })
    }

    const nextMoment = (await this.prisma.moment.findFirst({
      where: { id: momentId, userId: this.userId },
      include: {
        comments: true,
        likes: true,
      },
    })) as MomentRow | null

    return nextMoment ? toMomentPost(nextMoment) : null
  }

  async addComment(momentId: string, userName: string, text: string) {
    const moment = (await this.prisma.moment.findFirst({
      where: { id: momentId, userId: this.userId },
      select: { id: true, branchId: true },
    })) as { id: string; branchId: string } | null

    if (!moment) return null

    const timestamp = Date.now()
    const comment = (await this.prisma.momentComment.create({
      data: {
        id: makeId('comment'),
        momentId,
        userId: this.userId,
        branchId: moment.branchId,
        userName,
        content: text,
        timestamp,
      },
    })) as MomentCommentRow

    const nextMoment = (await this.prisma.moment.findFirst({
      where: { id: momentId, userId: this.userId },
      include: {
        comments: true,
        likes: true,
      },
    })) as MomentRow | null

    if (!nextMoment) return null

    return {
      comment: toMomentComment(comment),
      moment: toMomentPost(nextMoment),
    }
  }

  async createBranchFromPreview(preview: BranchPreview) {
    const timestamp = Date.now()

    const branch = (await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const branchCount = await tx.branch.count({
        where: { userId: this.userId },
      })

      const nextBranchNumber = String(branchCount).padStart(3, '0')
      const created = await tx.branch.create({
        data: {
          id: makeId('br'),
          userId: this.userId,
          branchNumber: nextBranchNumber,
          name: preview.name,
          profession: preview.profession,
          workplace: preview.workplace,
          world: '平行分支',
          icon: preview.icon,
          color: preview.color,
          bio: preview.bio,
          coverUrl: buildBranchCoverUrl(preview.profession, preview.workplace),
          status: 'ready',
          sourceYear: preview.sourceYear ?? null,
          sourceDesc: preview.sourceDescription ?? null,
          timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })

      await tx.moment.create({
        data: {
          id: makeId('mo'),
          userId: this.userId,
          branchId: created.id,
          content: `${created.name} 已完成同步，正在适应新的主线。`,
          imageUrl: null,
          timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })

      return created
    })) as BranchRow

    return toBranchProfile(branch)
  }

  async updateBranch(id: string, payload: UpdateBranchInput) {
    const branch = (await this.prisma.branch.findFirst({
      where: { id, userId: this.userId },
    })) as BranchRow | null

    if (!branch) return null

    const updated = (await this.prisma.branch.update({
      where: { id },
      data: {
        name: payload.name ?? undefined,
        profession: payload.profession ?? undefined,
        workplace: payload.workplace ?? undefined,
        world: payload.world ?? undefined,
        icon: payload.icon ?? undefined,
        color: payload.color ?? undefined,
        bio: payload.bio ?? undefined,
        coverUrl: payload.cover ?? undefined,
        status: payload.status ?? undefined,
        updatedAt: Date.now(),
      },
    })) as BranchRow

    return toBranchProfile(updated)
  }

  async generateBranchPreview(year: string, description: string) {
    const branchCount = await this.prisma.branch.count({
      where: { userId: this.userId },
    })

    return buildPreviewFromPrompt({
      year,
      description,
      user: await this.getProfile(),
      branchNumber: String(branchCount).padStart(3, '0'),
    })
  }

  async generateMomentDraft(input: GenerateMomentDraftInput) {
    const mainBranchId = await this.getMainBranchId()
    const branch =
      (input.branchId ? await this.getBranchById(input.branchId) : null) ??
      (await this.getBranchById(mainBranchId)) ??
      (await this.listBranches())[0]

    const topic = input.topic?.trim() || '日常'

    return {
      content: `${branch?.name ?? '未命名分身'} 在${branch?.workplace ?? '某个角落'} 记录了一段关于「${topic}」的新动态。`,
      imageUrl: null as string | null,
    }
  }

  async generateReply(input: GenerateReplyInput) {
    const branch = await this.getBranchById(input.branchId)
    if (!branch) return '收到，先忙一会儿。'

    const placeholderMoment: MomentPost = {
      id: makeId('moment'),
      branchId: branch.id,
      content: '',
      imageUrl: null,
      timestamp: Date.now(),
      likes: [],
      comments: [],
    }

    return buildBranchReply(branch, placeholderMoment, input.comment)
  }

  async createFileRecord(input: CreateFileRecordInput) {
    const record = await this.prisma.fileRecord.create({
      data: {
        id: input.id,
        userId: this.userId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        mimeType: input.mimeType,
        size: input.size,
        source: 'upload',
        timestamp: input.timestamp ?? Date.now(),
      },
    })

    return toFileRecord(record as unknown as FileRecordRow)
  }

  async listFiles() {
    const files = (await this.prisma.fileRecord.findMany({
      where: { userId: this.userId },
      orderBy: { timestamp: 'desc' },
    })) as FileRecordRow[]

    return files.map((file) => toFileRecord(file))
  }
}

const databaseStoreProto = DatabaseStore.prototype as DatabaseStore & Record<string, unknown>

(databaseStoreProto as any).sendMessage = async function (this: any, partnerId: string, text: string) {
  const store = this as any
  const branch = await store.prisma.branch.findFirst({
    where: { id: partnerId, userId: store.userId },
  })

  if (!branch) return null
  const branchProfile = toBranchProfile(branch as BranchRow)

  const timestamp = Date.now()
  const userMessageId = makeId('msg')
  const userMessage: ChatMessage = {
    id: userMessageId,
    partnerId,
    text,
    isMe: true,
    timestamp,
  }

  await store.prisma.message.create({
    data: {
      id: userMessageId,
      userId: store.userId,
      branchId: partnerId,
      senderType: 'me',
      content: text,
      contentType: 'text',
      isRead: false,
      timestamp,
    },
  })

  let replyMessage: ChatMessage | null = null
  const mainBranchId = await store.getMainBranchId()
  if (partnerId !== mainBranchId) {
    const replyText = await generateChatReply(branchProfile, text)
    const replyMessageId = makeId('msg')
    replyMessage = {
      id: replyMessageId,
      partnerId,
      text: replyText,
      isMe: false,
      timestamp: timestamp + 1,
    }

    await store.prisma.message.create({
      data: {
        id: replyMessageId,
        userId: store.userId,
        branchId: partnerId,
        senderType: 'branch',
        content: replyText,
        contentType: 'text',
        isRead: false,
        timestamp: timestamp + 1,
      },
    })
  }

  return {
    userMessage,
    replyMessage,
    messages: replyMessage ? [userMessage, replyMessage] : [userMessage],
  }
};

(databaseStoreProto as any).generateMomentDraft = async function (
  this: any,
  input: GenerateMomentDraftInput,
) {
  const store = this as any
  const mainBranchId = await store.getMainBranchId()
  const branch =
    (input.branchId ? await store.getBranchById(input.branchId) : null) ??
    (await store.getBranchById(mainBranchId)) ??
    (await store.listBranches())[0]

  const topic = input.topic?.trim() || '日常'

  if (!branch) {
    return {
      content: `${topic}。`,
      imageUrl: null as string | null,
    }
  }

  return generateMomentDraft(await store.getProfile(), branch, topic)
};

(databaseStoreProto as any).generateMomentDraft = async function (
  this: any,
  input: GenerateMomentDraftInput,
) {
  const store = this as any
  const mainBranchId = await store.getMainBranchId()
  const branch =
    (input.branchId ? await store.getBranchById(input.branchId) : null) ??
    (await store.getBranchById(mainBranchId)) ??
    (await store.listBranches())[0]

  const topic = input.topic?.trim() || '日常'

  if (!branch) {
    return {
      content: `${topic}。`,
      imageUrl: null as string | null,
    }
  }

  return generateMomentDraft(await store.getProfile(), branch, topic)
};

(databaseStoreProto as any).generateReply = async function (this: any, input: GenerateReplyInput) {
  const store = this as any
  const branch = await store.getBranchById(input.branchId)
  if (!branch) return '收到，先忙一会儿。'

  return generateMomentCommentReply(branch, input.momentContent ?? '', input.comment)
};
