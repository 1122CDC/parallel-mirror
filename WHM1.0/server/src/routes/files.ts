import { Router } from 'express'
import multer from 'multer'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AppStore } from '../store/contracts'
import { asyncRoute } from '../utils/asyncRoute'
import { makeId } from '../utils/id'
import { buildUploadFileName, getUploadDir } from '../utils/upload'

const upload = multer({
  storage: multer.memoryStorage(),
})

export function createFilesRouter(store: AppStore) {
  const router = Router()

  router.post(
    '/upload',
    upload.single('file'),
    asyncRoute(async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: '请先上传文件' })
      }

      const id = makeId('file')
      const storedName = buildUploadFileName(id, req.file.originalname)
      const uploadDir = getUploadDir()

      await mkdir(uploadDir, { recursive: true })
      await writeFile(join(uploadDir, storedName), req.file.buffer)

      const record = await store.createFileRecord({
        id,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${storedName}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        timestamp: Date.now(),
      })

      res.status(201).json(record)
    }),
  )

  return router
}
