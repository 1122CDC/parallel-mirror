import type { BranchProfile, ChatMessage, MomentPost, UserProfile } from '@/types/domain'

export const seedProfile: UserProfile = {
  name: '未命名用户',
  gender: '男',
  age: 18,
  profession: '未设置',
  city: '未设置',
  bio: '这是你的独立账号，还没有填写个人资料。',
}

export const seedBranches: BranchProfile[] = []

export const seedMessages: ChatMessage[] = []

export const seedMoments: MomentPost[] = []
