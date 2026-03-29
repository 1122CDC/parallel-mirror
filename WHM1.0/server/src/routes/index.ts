import { Router } from 'express'
import { createAuthMiddleware } from '../auth/middleware'
import { prisma as defaultPrisma } from '../db/client'
import type { AppStore } from '../store/contracts'
import { createAdminRouter } from './admin'
import { createProtectedAuthRouter, createPublicAuthRouter } from './auth'
import { createAiRouter } from './ai'
import { createBranchesRouter } from './branches'
import { createChatsRouter } from './chats'
import { createDebugRouter } from './debug'
import { createFilesRouter } from './files'
import { createHealthRouter } from './health'
import { createMomentsRouter } from './moments'
import { createProfileRouter } from './profile'

export function createApiRouter(store: AppStore) {
  const router = Router()

  router.use('/health', createHealthRouter())
  router.use('/auth', createPublicAuthRouter(defaultPrisma))
  router.use('/admin', createAdminRouter(defaultPrisma))
  router.use(createAuthMiddleware(defaultPrisma))
  router.use('/auth', createProtectedAuthRouter(defaultPrisma))
  router.use('/profile', createProfileRouter(store))
  router.use('/branches', createBranchesRouter(store))
  router.use('/chats', createChatsRouter(store))
  router.use('/moments', createMomentsRouter(store))
  router.use('/files', createFilesRouter(store))
  router.use('/ai', createAiRouter(store))
  router.use('/debug', createDebugRouter(store))

  return router
}
