import { http } from './http'
import type {
  BranchPreview,
  BranchProfile,
  ChatMessage,
  MomentComment,
  MomentPost,
  UserProfile,
} from '@/types/domain'

export interface ChatCardDto {
  branch: BranchProfile
  lastMessage: ChatMessage | null
}

export async function fetchProfile() {
  const { data } = await http.get<UserProfile>('/profile')
  return data
}

export async function updateProfile(payload: Partial<UserProfile>) {
  const { data } = await http.put<UserProfile>('/profile', payload)
  return data
}

export async function fetchBranches() {
  const { data } = await http.get<BranchProfile[]>('/branches')
  return data
}

export async function fetchMessages(branchId: string) {
  const { data } = await http.get<ChatMessage[]>(`/chats/${branchId}/messages`)
  return data
}

export async function sendMessage(branchId: string, text: string) {
  const { data } = await http.post<{
    userMessage: ChatMessage
    replyMessage: ChatMessage | null
    messages: ChatMessage[]
  }>(`/chats/${branchId}/messages`, { text })
  return data
}

export async function fetchMoments() {
  const { data } = await http.get<MomentPost[]>('/moments')
  return data
}

export async function likeMoment(momentId: string, userName = '未命名用户') {
  const { data } = await http.post<MomentPost>(`/moments/${momentId}/like`, { userName })
  return data
}

export async function commentMoment(momentId: string, userName: string, text: string) {
  const { data } = await http.post<{ comment: MomentComment; moment: MomentPost }>(
    `/moments/${momentId}/comments`,
    { userName, text },
  )
  return data
}

export async function previewBranch(year: string, description: string) {
  const { data } = await http.post<BranchPreview>('/branches/preview', {
    year,
    description,
  })
  return data
}

export async function createBranch(preview: BranchPreview) {
  const { data } = await http.post<BranchProfile>('/branches', preview)
  return data
}

export async function resetDevelopmentData() {
  const { data } = await http.post<{ ok: boolean }>('/debug/reset')
  return data
}

export async function generateReply(branchId: string, comment: string, momentContent?: string) {
  const { data } = await http.post<{ text: string }>('/ai/replies', {
    branchId,
    comment,
    momentContent,
  })
  return data.text
}
