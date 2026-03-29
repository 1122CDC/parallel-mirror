import type { BranchPreview, BranchProfile, ChatCard, ChatMessage, MomentComment, MomentPost, UploadedFileRecord, UserProfile } from '../types/domain'
import { createSeedState, type SeedState } from '../data/seed'
import { buildBranchPreview as buildPreviewFromPrompt } from '../utils/branchPreview'
import { generateChatReply, generateMomentCommentReply, generateMomentDraft } from '../utils/aiInteractions'
import { buildBranchCoverUrl } from '../utils/cover'
import { buildBranchReply } from '../utils/branchReply'
import { makeId } from '../utils/id'
import type { CreateFileRecordInput } from './contracts'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function assignDefined(target: Record<string, unknown>, payload: Record<string, unknown>) {
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      target[key] = value
    }
  }
}

function createReplyMoment(author: BranchProfile, text: string): MomentPost {
  return {
    id: makeId('moment'),
    branchId: author.id,
    content: text,
    imageUrl: null,
    timestamp: Date.now(),
    likes: [],
    comments: [],
  }
}

export interface SendMessageResult {
  userMessage: ChatMessage
  replyMessage: ChatMessage | null
  messages: ChatMessage[]
}

export interface CreateMomentInput {
  branchId: string
  content: string
  imageUrl?: string | null
}

export interface UpdateBranchInput {
  name?: string
  profession?: string
  workplace?: string
  world?: string
  icon?: string
  color?: string
  bio?: string
  cover?: string
  status?: BranchProfile['status']
}

export interface GenerateMomentDraftInput {
  branchId?: string
  topic?: string
}

export interface GenerateReplyInput {
  branchId: string
  comment: string
  momentContent?: string
}

export class MemoryStore {
  private state: SeedState

  constructor(seed: SeedState = createSeedState()) {
    this.state = clone(seed)
  }

  reset() {
    this.state = createSeedState()
  }

  getProfile() {
    return clone(this.state.profile)
  }

  updateProfile(payload: Partial<UserProfile>) {
    assignDefined(this.state.profile as unknown as Record<string, unknown>, payload as unknown as Record<string, unknown>)

    const mainBranchId = this.state.profile.mainBranchId ?? 'origin'
    const mainBranch = this.getBranchById(mainBranchId)
    if (mainBranch) {
      mainBranch.profession = this.state.profile.profession
      mainBranch.workplace = this.state.profile.city
      mainBranch.bio = this.state.profile.bio
      this.replaceBranch(mainBranch)
    }

    return this.getProfile()
  }

  listBranches() {
    return clone([...this.state.branches].sort((a, b) => b.timestamp - a.timestamp))
  }

  getBranchById(id: string) {
    return this.state.branches.find((branch) => branch.id === id) ?? null
  }

  replaceBranch(nextBranch: BranchProfile) {
    const index = this.state.branches.findIndex((branch) => branch.id === nextBranch.id)
    if (index >= 0) {
      this.state.branches[index] = nextBranch
    }
  }

  listChatCards(): ChatCard[] {
    return this.listBranches().map((branch) => ({
      branch,
      lastMessage: this.getLatestMessage(branch.id),
    }))
  }

  getMessagesByPartnerId(partnerId: string) {
    return clone(
      this.state.messages
        .filter((message) => message.partnerId === partnerId)
        .sort((a, b) => a.timestamp - b.timestamp),
    )
  }

  getLatestMessage(partnerId: string) {
    const messages = this.getMessagesByPartnerId(partnerId)
    return messages[messages.length - 1] ?? null
  }

  sendMessage(partnerId: string, text: string): SendMessageResult | null {
    const branch = this.getBranchById(partnerId)
    if (!branch) return null

    const timestamp = Date.now()
    const userMessage: ChatMessage = {
      id: makeId('msg'),
      partnerId,
      text,
      isMe: true,
      timestamp,
    }
    this.state.messages.push(userMessage)

    let replyMessage: ChatMessage | null = null
    if (partnerId !== (this.state.profile.mainBranchId ?? 'origin')) {
      replyMessage = {
        id: makeId('msg'),
        partnerId,
        text: `收到，我在${branch.workplace}。`,
        isMe: false,
        timestamp: timestamp + 1,
      }
      this.state.messages.push(replyMessage)
    }

    return {
      userMessage: clone(userMessage),
      replyMessage: replyMessage ? clone(replyMessage) : null,
      messages: clone(replyMessage ? [userMessage, replyMessage] : [userMessage]),
    }
  }

  listMoments() {
    return clone([...this.state.moments].sort((a, b) => b.timestamp - a.timestamp))
  }

  getMomentById(id: string) {
    return this.state.moments.find((moment) => moment.id === id) ?? null
  }

  createMoment(input: CreateMomentInput) {
    const branch = this.getBranchById(input.branchId)
    if (!branch) return null

    const moment: MomentPost = {
      id: makeId('mo'),
      branchId: input.branchId,
      content: input.content,
      imageUrl: input.imageUrl ?? null,
      timestamp: Date.now(),
      likes: [],
      comments: [],
    }

    this.state.moments.unshift(moment)
    return clone(moment)
  }

  toggleLike(momentId: string, userName = '未命名用户') {
    const moment = this.getMomentById(momentId)
    if (!moment) return null

    if (moment.likes.includes(userName)) {
      moment.likes = moment.likes.filter((name) => name !== userName)
    } else {
      moment.likes.push(userName)
    }

    return clone(moment)
  }

  addComment(momentId: string, userName: string, text: string) {
    const moment = this.getMomentById(momentId)
    if (!moment) return null

    const comment: MomentComment = { userName, text }
    moment.comments.push(comment)

    return {
      comment: clone(comment),
      moment: clone(moment),
    }
  }

  createBranchFromPreview(preview: BranchPreview) {
    const timestamp = Date.now()
    const branchNumber = String(this.state.branches.length).padStart(3, '0')

    const branch: BranchProfile = {
      id: makeId('br'),
      branchNumber,
      name: preview.name,
      profession: preview.profession,
      workplace: preview.workplace,
      world: '平行分支',
      icon: preview.icon,
      color: preview.color,
      bio: preview.bio,
      cover: buildBranchCoverUrl(preview.profession, preview.workplace),
      status: 'ready',
      timestamp,
    }

    this.state.branches.push(branch)
    this.state.moments.unshift({
      id: makeId('mo'),
      branchId: branch.id,
      content: `${branch.name} 已完成同步，正在适应新的主线。`,
      imageUrl: null,
      timestamp,
      likes: [],
      comments: [],
    })

    return clone(branch)
  }

  updateBranch(id: string, payload: UpdateBranchInput) {
    const branch = this.getBranchById(id)
    if (!branch) return null

    assignDefined(branch as unknown as Record<string, unknown>, payload as unknown as Record<string, unknown>)
    this.replaceBranch(branch)
    return clone(branch)
  }

  generateBranchPreview(year: string, description: string) {
    const branchNumber = String(this.state.branches.length).padStart(3, '0')
    return buildPreviewFromPrompt({
      year,
      description,
      user: this.state.profile,
      branchNumber,
    })
  }

  generateMomentDraft(input: GenerateMomentDraftInput) {
    const branch = input.branchId ? this.getBranchById(input.branchId) : null
    const target =
      branch ??
      this.getBranchById(this.state.profile.mainBranchId ?? 'origin') ??
      this.state.branches[0]
    const topic = input.topic?.trim() || '日常'

    return {
      content: `${target?.name ?? '未命名分身'} 在 ${target?.workplace ?? '某个角落'} 记录了关于「${topic}」的一段新动态。`,
      imageUrl: null as string | null,
    }
  }

  generateReply(input: GenerateReplyInput) {
    const branch = this.getBranchById(input.branchId)
    if (!branch) return '收到，先忙一会儿。'

    const moment = createReplyMoment(branch, '')
    return buildBranchReply(branch, moment, input.comment)
  }

  createFileRecord(input: CreateFileRecordInput): UploadedFileRecord {
    const record: UploadedFileRecord = {
      id: input.id,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      mimeType: input.mimeType,
      size: input.size,
      source: 'upload',
      timestamp: input.timestamp ?? Date.now(),
    }

    this.state.files.push(record)
    return clone(record)
  }

  listFiles() {
    return clone(this.state.files)
  }
}

const memoryStoreProto = MemoryStore.prototype as MemoryStore & Record<string, unknown>

(memoryStoreProto as any).sendMessage = async function (this: any, partnerId: string, text: string) {
  const store = this as any
  const branch = store.getBranchById(partnerId)
  if (!branch) return null

  const timestamp = Date.now()
  const userMessage: ChatMessage = {
    id: makeId('msg'),
    partnerId,
    text,
    isMe: true,
    timestamp,
  }
  store.state.messages.push(userMessage)

  let replyMessage: ChatMessage | null = null
  if (partnerId !== (store.state.profile.mainBranchId ?? 'origin')) {
    const replyText = await generateChatReply(branch, text)
    replyMessage = {
      id: makeId('msg'),
      partnerId,
      text: replyText,
      isMe: false,
      timestamp: timestamp + 1,
    }
    store.state.messages.push(replyMessage)
  }

  return {
    userMessage: clone(userMessage),
    replyMessage: replyMessage ? clone(replyMessage) : null,
    messages: clone(replyMessage ? [userMessage, replyMessage] : [userMessage]),
  }
};

(memoryStoreProto as any).generateMomentDraft = async function (this: any, input: GenerateMomentDraftInput) {
  const store = this as any
  const branch =
    (input.branchId ? store.getBranchById(input.branchId) : null) ??
    store.getBranchById(store.state.profile.mainBranchId ?? 'origin') ??
    store.state.branches[0]

  const topic = input.topic?.trim() || '日常'

  if (!branch) {
    return {
      content: `${topic}。`,
      imageUrl: null as string | null,
    }
  }

  return generateMomentDraft(store.state.profile, branch, topic)
};

(memoryStoreProto as any).generateReply = async function (this: any, input: GenerateReplyInput) {
  const store = this as any
  const branch = store.getBranchById(input.branchId)
  if (!branch) return '收到，先忙一会儿。'

  return generateMomentCommentReply(branch, input.momentContent ?? '', input.comment)
};
