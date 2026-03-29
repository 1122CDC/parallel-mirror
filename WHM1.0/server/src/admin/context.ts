import { AsyncLocalStorage } from 'node:async_hooks'

export interface AdminAuthContext {
  username: string
  displayName: string
  token: string
}

const adminStorage = new AsyncLocalStorage<AdminAuthContext>()

export function runWithAdminAuthContext<T>(context: AdminAuthContext, callback: () => T) {
  return adminStorage.run(context, callback)
}

export function getAdminAuthContext() {
  return adminStorage.getStore() ?? null
}
