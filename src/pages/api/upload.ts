import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { z } from 'zod'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export const config = {
  api: {
    bodyParser: { sizeLimit: '3000mb' },
  },
}

const uploadSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().max(40),
  data: z.array(z.number().int().min(0).max(255)),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method not allowed')
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(401).json({ message: 'Unauthorized.' })
  const parsed = uploadSchema.safeParse(req.body)
  if (!parsed.success) return res.status(422).json({ message: 'Invalid upload.' })

  const { name, type, data } = parsed.data
  const filename = `${uuidv4()}${path.extname(path.basename(name))}`
  const directory = path.resolve('./uploads/chats')
  const filePath = path.join(directory, filename)
  await fs.mkdir(directory, { recursive: true })
  try {
    await fs.writeFile(filePath, Buffer.from(data))
    if (type === 'profile') {
      await prisma.user.update({
        where: { email },
        data: { picturePath: filename },
      })
    }
  } catch (error) {
    await fs.unlink(filePath).catch((cleanupError) => {
      if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Could not remove failed upload:', cleanupError)
      }
    })
    console.error('Could not save uploaded file:', error)
    return res.status(500).json({ message: 'Could not upload file.' })
  }

  const extension = path.extname(filename).toLowerCase()
  const fileType = ['.jpg', '.jpeg', '.png', '.gif'].includes(extension)
    ? 'image'
    : ['.mp4', '.mov', '.avi'].includes(extension)
      ? 'video'
      : 'other'
  return res.status(200).json({ data: filename, type: fileType })
}
