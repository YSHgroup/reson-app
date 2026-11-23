import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
var pos = require('pos')
import multer from 'multer'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { ProjectStatus } from '../../../generated/prisma/client'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, parseProjectInput, unmigratedAccountMessage } from '@lib/project-api'

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
      if (process.env.DATABASE_URL) {
        try {
          const account = await getPrismaAccount(req, res)
          if (account.status === 'unauthenticated') {
            return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
          }
          if (account.status === 'unmigrated') {
            return res.status(409).json({ message: unmigratedAccountMessage() })
          }

          const parsed = parseProjectInput(fields)
          if (!parsed.success) {
            return res.status(RS.CERROR_UNPROCESSABLE).json({ message: parsed.message })
          }

          await prisma.project.create({
            data: {
              ...parsed.data,
              authorId: account.user.id,
              status: ProjectStatus.OPEN,
              fileUrl: uploadedFileName,
            },
          })
          return res.status(200).json({ message: 'success' })
        } catch (error) {
          console.error('Project file create failed:', error)
          return res.status(500).json({ error: 'Failed to upload file' })
        }
      }

      const client = await connectToDatabase()
      const needCollection = client.db().collection('needs')
      try {
        const result = await needCollection.insertOne({
          author: session?.user?.email,
          title: fields.title,
          startLine: fields.startLine,
          deadLine: fields.deadLine,
          price: fields.price * 1,
          description: fields.description,
          payType: fields.payType,
          file: uploadedFileName,
          where: fields.where,
          payUnit: fields.payUnit,
          role: fields.role,
          exist: 1,
          created_at: Date.now(),
        })
        client.close()
        res.status(200).send({ message: 'success' })
      } catch (error) {
        res.status(500).send({ error: 'Failed to upload file' })
      }
    })
  } catch (error) {
    res.status(500).send({ error: 'Failed to upload file' })
  }
}
