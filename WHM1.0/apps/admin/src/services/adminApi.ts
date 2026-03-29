import axios from 'axios'
import type {
  AdminAccount,
  AdminBranchDetail,
  AdminBranchListItem,
  AdminPageResponse,
  AdminStats,
  AdminUserDetail,
  AdminUserSummary,
} from '@/types'

const TOKEN_KEY = 'whm_admin_token'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60_000,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export interface AdminLoginResponse {
  token: string
  admin: AdminAccount
}

export interface AdminMeResponse {
  admin: AdminAccount
}

export interface AdminDashboardResponse {
  userCount: number
  branchCount: number
  momentCount: number
  messageCount: number
  fileCount: number
  aiJobCount: number
}

export interface AdminUserListQuery {
  q?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface AdminBranchListQuery {
  q?: string
  status?: string
  userId?: string
  page?: number
  pageSize?: number
}

export async function loginAdmin(username: string, password: string) {
  const { data } = await http.post<AdminLoginResponse>('/admin/login', {
    username,
    password,
  })

  return data
}

export async function fetchAdminMe() {
  const { data } = await http.get<AdminMeResponse>('/admin/me')
  return data
}

export async function logoutAdmin() {
  const { data } = await http.post<{ ok: boolean }>('/admin/logout')
  return data
}

export async function fetchAdminStats() {
  const { data } = await http.get<AdminDashboardResponse>('/admin/stats')
  return data
}

export async function fetchAdminUsers(query: AdminUserListQuery = {}) {
  const { data } = await http.get<AdminPageResponse<AdminUserSummary>>('/admin/users', {
    params: query,
  })
  return data
}

export async function fetchAdminUserDetail(userId: string) {
  const { data } = await http.get<AdminUserDetail>(`/admin/users/${userId}`)
  return data
}

export async function fetchAdminBranches(query: AdminBranchListQuery = {}) {
  const { data } = await http.get<AdminPageResponse<AdminBranchListItem>>('/admin/branches', {
    params: query,
  })
  return data
}

export async function fetchAdminBranchDetail(branchId: string) {
  const { data } = await http.get<AdminBranchDetail>(`/admin/branches/${branchId}`)
  return data
}
