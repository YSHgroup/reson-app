import type { NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import type { Request, Response } from 'express'

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    fs.mkdirSync('./uploads/chats', { recursive: true })
    callback(null, './uploads/chats')
  },
  filename(_req, file, callback) {
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
  },
})
const uploadMiddleware = multer({ storage }).single('file')

export const config = { api: { bodyParser: false } }

export default async function handler(req: any, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })

  uploadMiddleware(req as Request, res as unknown as Response, async (error: unknown) => {
    if (error) {
      console.error('Group avatar upload failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not upload group avatar.' })
    }
    const discardUpload = async () => {
      if (!req.file?.path) return
      try {
        await fs.promises.unlink(req.file.path)
      } catch (cleanupError) {
        if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error('Could not remove failed group avatar upload:', cleanupError)
        }
      }
    }
    let previousAvatarUrl: string | null = null
    try {
      const { groupInfo, people, groupName } = JSON.parse(req.body.fields)
      const groupId = groupInfo?._id
      if (!req.file || typeof groupId !== 'string' || typeof groupName !== 'string' || !groupName.trim() || !Array.isArray(people)) {
        await discardUpload()
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid group details.' })
      }
      const group = await prisma.chatGroup.findFirst({
        where: { id: groupId, members: { some: { user: { email } } } },
        select: { avatarUrl: true },
      })
      if (!group) {
        await discardUpload()
        return res.status(RS.CERROR_NOTFOUND).json({ message: 'Group not found.' })
      }
      previousAvatarUrl = group.avatarUrl

      const memberEmails = Array.from(
        new Set([email, ...people.map((person: { email?: unknown }) => person.email)])
      )
      if (!memberEmails.every((member): member is string => typeof member === 'string' && member.length > 0)) {
        await discardUpload()
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid group members.' })
      }
      const users = await prisma.user.findMany({
        where: { email: { in: memberEmails } },
        select: { id: true },
      })
      if (users.length !== memberEmails.length) {
        await discardUpload()
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'One or more group members do not exist.' })
      }
      await prisma.$transaction([
        prisma.groupMember.deleteMany({ where: { groupId } }),
        prisma.chatGroup.update({
          where: { id: groupId },
          data: {
            title: groupName.trim(),
            avatarUrl: req.file?.filename,
            members: { create: users.map(({ id }) => ({ userId: id })) },
          },
        }),
      ])
    } catch (requestError) {
      console.error('Group update failed:', requestError)
      await discardUpload()
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not update group.' })
    }
    if (previousAvatarUrl) {
      const previousAvatar = path.join('./uploads/chats', path.basename(previousAvatarUrl))
      if (fs.existsSync(previousAvatar)) {
        try {
          await fs.promises.unlink(previousAvatar)
        } catch (cleanupError) {
          console.error('Could not remove previous group avatar:', cleanupError)
        }
      }
    }
    return res.status(RS.SUCCESS_OK).json({ message: 'Success' })
  })
}
