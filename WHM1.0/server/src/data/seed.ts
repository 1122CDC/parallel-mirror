import type { BranchProfile, ChatMessage, MomentPost, UploadedFileRecord, UserProfile } from '../types/domain'

export interface SeedState {
  profile: UserProfile
  branches: BranchProfile[]
  messages: ChatMessage[]
  moments: MomentPost[]
  files: UploadedFileRecord[]
}

export function createSeedState(): SeedState {
  return {
    profile: {
      name: '未命名用户',
      gender: '男',
      age: 18,
      profession: '未设置',
      city: '未设置',
      bio: '这是你的独立账号，还没有填写个人资料。',
    },
    branches: [],
    messages: [],
    moments: [],
    files: [],
  }
}
