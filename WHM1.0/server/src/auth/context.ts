import { AsyncLocalStorage } from 'node:async_hooks'
import { DEFAULT_USER_ID } from '../data/bootstrap'

export interface AuthContext {
  userId: string
  token: string
}

const authStorage = new AsyncLocalStorage<AuthContext>()

export function runWithAuthContext<T>(context: AuthContext, callback: () => T) {
  return authStorage.run(context, callback)
}

export function getAuthContext() {
  return authStorage.getStore() ?? null
}

export function getCurrentUserId() {
  return authStorage.getStore()?.userId ?? DEFAULT_USER_ID
}

export function getCurrentToken() {
  return authStorage.getStore()?.token ?? ''
}
