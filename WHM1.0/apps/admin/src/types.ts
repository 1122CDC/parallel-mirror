export interface AdminAccount {
  username: string
  displayName: string
}

export interface AdminStats {
  userCount: number
  branchCount: number
  momentCount: number
  messageCount: number
  fileCount: number
  aiJobCount: number
}

export interface AdminProfile {
  name: string
  gender: string
  age: number
  profession: string
  city: string
  bio: string
  mainBranchId: string | null
  updatedAt: number
}

export interface AdminUserMini {
  id: string
  phone: string | null
  nickname: string | null
  avatarUrl: string | null
  status: string
  createdAt: number
  updatedAt: number
}

export interface AdminBranch {
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
  sourceDescription: string | null
  timestamp: number
  createdAt: number
  updatedAt: number
  momentCount: number
  messageCount: number
}

export interface AdminUserSummary extends AdminUserMini {
  profile: AdminProfile | null
  branchCount: number
  momentCount: number
  messageCount: number
  fileCount: number
  aiJobCount: number
  latestBranch: AdminBranch | null
}

export interface AdminMomentComment {
  id: string
  momentId: string
  userId: string
  branchId: string | null
  userName: string
  content: string
  timestamp: number
}

export interface AdminMomentLike {
  id: string
  momentId: string
  userId: string
  userName: string
  timestamp: number
}

export interface AdminMoment {
  id: string
  branchId: string
  content: string
  imageUrl: string | null
  timestamp: number
  createdAt: number
  updatedAt: number
  comments: AdminMomentComment[]
  likes: AdminMomentLike[]
}

export interface AdminMessage {
  id: string
  branchId: string
  senderType: string
  content: string
  contentType: string
  isRead: boolean
  timestamp: number
}

export interface AdminFile {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  size: number
  source: string
  timestamp: number
}

export interface AdminAiJob {
  id: string
  jobType: string
  prompt: string
  status: string
  resultJson: string | null
  errorMsg: string | null
  createdAt: number
  completedAt: number | null
}

export interface AdminUserDetail {
  user: AdminUserMini
  profile: AdminProfile | null
  stats: {
    branches: number
    moments: number
    messages: number
    files: number
    aiJobs: number
  }
  branches: AdminBranch[]
  moments: AdminMoment[]
  messages: AdminMessage[]
  files: AdminFile[]
  aiJobs: AdminAiJob[]
}

export interface AdminBranchListItem {
  branch: AdminBranch
  user: AdminUserMini
  profile: AdminProfile | null
  userBranchCount: number
}

export interface AdminBranchDetail {
  branch: AdminBranch
  user: AdminUserMini
  profile: AdminProfile | null
  userBranchCount: number
  stats: {
    moments: number
    messages: number
  }
  moments: AdminMoment[]
  messages: AdminMessage[]
}

export interface AdminPageResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
