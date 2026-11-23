import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { toLegacyGroupMessage } from '@lib/chat-data'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Wrong HTTP Method' })
  }

  const groupId = typeof req.query.id === 'string' ? req.query.id : ''
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, user: { email } },
    select: { id: true },
  })
  if (!membership) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Group not found.' })

  const messages = await prisma.groupMessage.findMany({
    where: { groupId },
    include: { sender: { select: { email: true, nickname: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return res.status(RS.SUCCESS_OK).json({ groupMsgs: messages.map(toLegacyGroupMessage) })
}
