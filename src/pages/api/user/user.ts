import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { toLegacyDirectMessage } from '@lib/chat-data'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(401).json({ message: 'Unauthorized.' })

  const users = await prisma.user.findMany({
    where: { email: { not: email } },
    select: { id: true, email: true, nickname: true, picturePath: true },
    orderBy: { email: 'asc' },
  })
  const receivedMessages = await prisma.directMessage.findMany({
    where: {
      recipient: { email },
      author: { email: { in: users.map((user) => user.email) } },
    },
    include: { author: { select: { email: true } }, recipient: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const messagesByAuthor = new Map<string, ReturnType<typeof toLegacyDirectMessage>[]>()
  for (const message of receivedMessages) {
    const messages = messagesByAuthor.get(message.author.email) ?? []
    messages.push(toLegacyDirectMessage(message))
    messagesByAuthor.set(message.author.email, messages)
  }

  return res.json({
    status: 200,
    data: users.map((user) => {
      const messages = messagesByAuthor.get(user.email) ?? []
      return {
        ...user,
        _id: user.id,
        picpath: user.picturePath,
        msgs: messages,
        unreadCount: messages.filter((message) => message.read === false).length,
      }
    }),
  })
}
