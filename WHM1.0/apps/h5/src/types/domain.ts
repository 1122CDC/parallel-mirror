export type AppTab = 'chats' | 'contacts' | 'discover' | 'me'

export type BranchStatus = 'ready' | 'syncing'

export interface AuthUser {
  id: string
  phone: string
  nickname: string
  avatarUrl: string | null
}

export interface UserProfile {
  name: string
  gender: '男' | '女'
  age: number
  profession: string
  city: string
  bio: string
  mainBranchId?: string
}

export interface BranchProfile {
  id: string
  branchNumber: string
  name: string
  profession: string
  workplace: string
  world: string
  icon: string
  color: string
  bio: string
  cover: string
  status: BranchStatus
  timestamp: number
}

export interface ChatMessage {
  id: string
  partnerId: string
  text: string
  isMe: boolean
  timestamp: number
}

export interface MomentComment {
  userName: string
  text: string
}

export interface MomentPost {
  id: string
  branchId: string
  content: string
  imageUrl: string | null
  timestamp: number
  likes: string[]
  comments: MomentComment[]
}

export interface BranchPreview {
  name: string
  profession: string
  workplace: string
  icon: string
  color: string
  bio: string
  sourceYear?: string
  sourceDescription?: string
}

