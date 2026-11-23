import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { toLegacyDirectMessage, toLegacyGroupMessage } from '@lib/chat-data'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Wrong HTTP Method' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })

  const [unreadMessages, unreadGroupMessages] = await Promise.all([
    prisma.directMessage.findMany({
      where: { recipient: { email }, read: false },
      include: { author: { select: { email: true } }, recipient: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.groupMessage.findMany({
      where: {
        NOT: { readers: { has: email } },
        group: { members: { some: { user: { email } } } },
      },
      include: { sender: { select: { email: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  const messages = unreadMessages.map(toLegacyDirectMessage)
  const groupMessages = unreadGroupMessages.map(toLegacyGroupMessage)
  const totalUnreadChats = [...messages, ...groupMessages].sort((a, b) => {
    const aDate = new Date(`${a.date} ${a.time}`).getTime()
    const bDate = new Date(`${b.date} ${b.time}`).getTime()
    return bDate - aDate
  })

  return res.json({
    status: RS.SUCCESS_OK,
    data: {
      count: messages.length + groupMessages.length,
      messages,
      totalUnreadChats,
    },
  })
}
