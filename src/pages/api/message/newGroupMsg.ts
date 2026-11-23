import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { toLegacyGroupMessage } from '@lib/chat-data'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { formatTime, timestampToFormattedDate } from '@lib/utils'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Wrong HTTP Method' })
  }

  const parsed = z.object({
    message: z.object({
      groupId: z.string().min(1),
      content: z.string(),
      type: z.string().optional(),
    }),
  }).safeParse(req.body)
  if (!parsed.success) return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid message.' })
  const message = parsed.data.message
  const membership = await prisma.groupMember.findFirst({
    where: { groupId: message.groupId, user: { email } },
    select: { id: true },
  })
  if (!membership) return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Not a group member.' })

  const now = Date.now()
  const [saved] = await prisma.$transaction([
    prisma.groupMessage.create({
      data: {
        group: { connect: { id: message.groupId } },
        sender: { connect: { email } },
        content: message.content,
        type: message.type ?? 'text',
        readers: [email],
        metadata: {
          date: timestampToFormattedDate(now),
          time: formatTime(now),
        },
      },
      include: { sender: { select: { email: true, nickname: true } } },
    }),
    prisma.chatGroup.update({
      where: { id: message.groupId },
      data: { updatedAt: new Date(now) },
    }),
  ])
  const legacyMessage = toLegacyGroupMessage(saved)
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
    newChatInfo: { insertedId: saved.id },
    chat: legacyMessage,
  })
}
