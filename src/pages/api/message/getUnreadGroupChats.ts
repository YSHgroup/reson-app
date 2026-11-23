import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { toLegacyGroupMessage } from '@lib/chat-data'
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

  const unreadGroupMessages = await prisma.groupMessage.findMany({
    where: {
      NOT: { readers: { has: email } },
      group: { members: { some: { user: { email } } } },
    },
    include: { sender: { select: { email: true, nickname: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({
    status: RS.SUCCESS_OK,
    data: { unreadGroupChats: unreadGroupMessages.map(toLegacyGroupMessage) },
  })
}
