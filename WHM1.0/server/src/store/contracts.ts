import type {
  BranchPreview,
  BranchProfile,
  ChatCard,
  ChatMessage,
  MomentComment,
  MomentPost,
  UploadedFileRecord,
  UserProfile,
} from '../types/domain'

export type MaybePromise<T> = T | Promise<T>

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

export interface CreateFileRecordInput {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  size: number
  timestamp?: number
}

export interface AppStore {
  reset(): MaybePromise<void>
  getProfile(): MaybePromise<UserProfile>
  updateProfile(payload: Partial<UserProfile>): MaybePromise<UserProfile>
  listBranches(): MaybePromise<BranchProfile[]>
  getBranchById(id: string): MaybePromise<BranchProfile | null>
  listChatCards(): MaybePromise<ChatCard[]>
  getMessagesByPartnerId(partnerId: string): MaybePromise<ChatMessage[]>
  getLatestMessage(partnerId: string): MaybePromise<ChatMessage | null>
  sendMessage(partnerId: string, text: string): MaybePromise<SendMessageResult | null>
  listMoments(): MaybePromise<MomentPost[]>
  getMomentById(id: string): MaybePromise<MomentPost | null>
  createMoment(input: CreateMomentInput): MaybePromise<MomentPost | null>
  toggleLike(momentId: string, userName?: string): MaybePromise<MomentPost | null>
  addComment(
    momentId: string,
    userName: string,
    text: string,
  ): MaybePromise<{ comment: MomentComment; moment: MomentPost } | null>
  createBranchFromPreview(preview: BranchPreview): MaybePromise<BranchProfile>
  updateBranch(id: string, payload: UpdateBranchInput): MaybePromise<BranchProfile | null>
  generateBranchPreview(year: string, description: string): MaybePromise<BranchPreview>
  generateMomentDraft(input: GenerateMomentDraftInput): MaybePromise<{
    content: string
    imageUrl: string | null
  }>
  generateReply(input: GenerateReplyInput): MaybePromise<string>
  createFileRecord(input: CreateFileRecordInput): MaybePromise<UploadedFileRecord>
  listFiles(): MaybePromise<UploadedFileRecord[]>
}
