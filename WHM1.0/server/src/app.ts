import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { env } from './config/env'
import { createApiRouter } from './routes'
import type { AppStore } from './store/contracts'
import { getUploadDir } from './utils/upload'

const publicDir = join(process.cwd(), 'public')
const h5DistDir = join(publicDir, 'h5')
const adminDistDir = join(publicDir, 'admin')
const h5IndexFile = join(h5DistDir, 'index.html')
const adminIndexFile = join(adminDistDir, 'index.html')

function sendStaticIndex(indexPath: string, fallbackMessage: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!existsSync(indexPath)) {
      return res.status(404).json({ message: fallbackMessage })
    }

    return res.sendFile(indexPath, (error) => {
      if (error) {
        next(error)
      }
    })
  }
}

export function createApp(store: AppStore) {
  const app = express()

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use('/uploads', express.static(getUploadDir()))

  app.use('/api', createApiRouter(store))
  app.use('/admin', express.static(adminDistDir, { index: false }))
  app.get('/admin', sendStaticIndex(adminIndexFile, 'Admin frontend is not built yet'))
  app.get('/admin/*', sendStaticIndex(adminIndexFile, 'Admin frontend is not built yet'))
  app.use(express.static(h5DistDir, { index: false }))
  app.get(
    /^(?!\/api(?:\/|$)|\/admin(?:\/|$)|\/uploads(?:\/|$)).*/,
    sendStaticIndex(h5IndexFile, 'H5 frontend is not built yet'),
  )

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' })
  })

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error)
    res.status(500).json({ message: '服务器内部错误' })
  })

  return app
}
