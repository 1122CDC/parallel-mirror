import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchCurrentUser as fetchCurrentUserApi,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  type AuthSessionResponse,
  type AuthMeResponse,
} from '@/services/api/authApi'
import type { AuthUser, UserProfile } from '@/types/domain'

const TOKEN_KEY = 'whm_token'
const USER_KEY = 'whm_user'
const APP_STATE_KEY = 'whm_h5_demo_v1'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'

function readStoredUser() {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function clearAppCache() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(APP_STATE_KEY)
}

function persistSession(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSessionStorage() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY) ?? '')
  const user = ref<AuthUser | null>(readStoredUser())
  const profile = ref<UserProfile | null>(null)
  const status = ref<AuthStatus>('idle')
  let bootstrapPromise: Promise<boolean> | null = null

  const isAuthenticated = computed(() => status.value === 'authenticated' && !!token.value)
  const displayName = computed(() => user.value?.nickname || profile.value?.name || '未登录')

  function applyLoginPayload(payload: AuthSessionResponse | AuthMeResponse) {
    token.value = 'token' in payload ? payload.token : token.value
    user.value = payload.user
    profile.value = payload.profile

    if ('token' in payload) {
      persistSession(payload.token, payload.user)
      clearAppCache()
    }
  }

  async function bootstrap() {
    if (status.value === 'authenticated' || status.value === 'anonymous') {
      return isAuthenticated.value
    }

    if (bootstrapPromise) {
      return bootstrapPromise
    }

    if (!token.value) {
      clearSessionStorage()
      user.value = null
      profile.value = null
      status.value = 'anonymous'
      return false
    }

    status.value = 'loading'
    bootstrapPromise = fetchCurrentUserApi()
      .then((payload) => {
        applyLoginPayload(payload)
        status.value = 'authenticated'
        return true
      })
      .catch(() => {
        token.value = ''
        user.value = null
        profile.value = null
        clearSessionStorage()
        clearAppCache()
        status.value = 'anonymous'
        return false
      })
      .finally(() => {
        bootstrapPromise = null
      })

    return bootstrapPromise
  }

  async function login(phone: string, password: string) {
    const payload = await loginApi(phone, password)
    applyLoginPayload(payload)
    status.value = 'authenticated'
    return payload
  }

  async function register(phone: string, password: string) {
    const payload = await registerApi(phone, password)
    applyLoginPayload(payload)
    status.value = 'authenticated'
    return payload
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      token.value = ''
      user.value = null
      profile.value = null
      clearSessionStorage()
      clearAppCache()
      status.value = 'anonymous'
    }
  }

  function markAnonymous() {
    token.value = ''
    user.value = null
    profile.value = null
    clearSessionStorage()
    clearAppCache()
    status.value = 'anonymous'
  }

  return {
    bootstrap,
    displayName,
    isAuthenticated,
    login,
    register,
    logout,
    markAnonymous,
    profile,
    status,
    token,
    user,
  }
})
