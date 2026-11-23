import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, parseProjectInput } from '@lib/project-api'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('./uploads/needFiles')) {
      fs.mkdirSync('./uploads/needFiles', { recursive: true })
    }
    cb(null, './uploads/needFiles')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname)
    cb(null, uniqueSuffix)
  },
})
const uploadMiddleware = multer({ storage: storage }).single('file')

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: any, res: NextApiResponse) {
  try {
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    if (session == undefined) {
      return res.status(RS.CERROR_UNAUTHORIZED).json({
        message: 'Unauthorized',
      })
    }
    uploadMiddleware(req as any, res as any, async function (err: any) {
      if (err instanceof multer.MulterError) {
        return res.status(RS.SERROR_INTERNAL).json({
          message: err,
        })
      } else if (err) {
        // An unknown error occurred when uploading.
        return res.status(RS.SERROR_INTERNAL).json({
          message: err,
        })
      }
      const fields = JSON.parse(req.body.fields)
      const uploadedFileName = req.file.filename
      try {
        const account = await getPrismaAccount(req, res)
        if (account.status === 'unauthenticated') {
          return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
        }
        const parsed = parseProjectInput(fields)
        if (!parsed.success) {
          return res.status(RS.CERROR_UNPROCESSABLE).json({ message: parsed.message })
        }
        const updated = await prisma.project.updateMany({
          where: {
            id: typeof fields._id === 'string' ? fields._id : '',
            authorId: account.user.id,
          },
          data: { ...parsed.data, status: 'OPEN', fileUrl: uploadedFileName },
        })
        if (updated.count === 0) {
          return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })
        }
        return res.status(200).json({ message: 'success' })
      } catch (error) {
        console.error('Project file update failed:', error)
        return res.status(500).json({ error: 'Failed to upload file' })
      }

    })
  } catch (error) {
    res.status(500).send({ error: 'Failed to upload file' })
  }
}
