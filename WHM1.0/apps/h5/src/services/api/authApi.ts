import { http } from './http'
import type { AuthUser, UserProfile } from '@/types/domain'

export interface AuthSessionResponse {
  token: string
  isNewUser: boolean
  user: AuthUser
  profile: UserProfile | null
}

export interface AuthMeResponse {
  user: AuthUser
  profile: UserProfile | null
}

export async function login(phone: string, password: string) {
  const { data } = await http.post<AuthSessionResponse>('/auth/login', {
    phone,
    password,
  })

  return data
}

export async function register(phone: string, password: string) {
  const { data } = await http.post<AuthSessionResponse>('/auth/register', {
    phone,
    password,
  })

  return data
}

export async function fetchCurrentUser() {
  const { data } = await http.get<AuthMeResponse>('/auth/me')
  return data
}

export async function logout() {
  const { data } = await http.post<{ ok: boolean }>('/auth/logout')
  return data
}
