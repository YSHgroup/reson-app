import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { toggleReaction } from '@lib/chat-data'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Wrong HTTP Method' })
  }

  const { msgId, emojiId } = req.body ?? {}
  if (typeof msgId !== 'string' || typeof emojiId !== 'string' || !emojiId) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid reaction.' })
  }
  const message = await prisma.groupMessage.findFirst({
    where: { id: msgId, group: { members: { some: { user: { email } } } } },
    select: { id: true, reactions: true },
  })
  if (!message) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Message not found.' })
  const result = await prisma.groupMessage.update({
    where: { id: message.id },
    data: { reactions: toggleReaction(message.reactions, emojiId, email) },
  })
  return res.status(RS.SUCCESS_OK).json({ message: 'success', result })
}
