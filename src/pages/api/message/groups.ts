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

  if (typeof req.query.id === 'string') {
    const group = await prisma.chatGroup.findFirst({
      where: { id: req.query.id, members: { some: { user: { email } } } },
      include: {
        owner: { select: { email: true } },
        members: { include: { user: { select: { email: true } } } },
      },
    })
    if (!group) return res.status(RS.CERROR_NOTFOUND).json({ group: null })
    return res.status(RS.SUCCESS_OK).json({
      group: {
        _id: group.id,
        title: group.title,
        owner: group.owner.email,
        members: group.members.map((member) => member.user.email),
        groupAvatar: group.avatarUrl,
        created: group.createdAt,
        modified: group.updatedAt,
      },
    })
  }

  const groups = await prisma.chatGroup.findMany({
    where: { members: { some: { user: { email } } } },
    include: {
      owner: { select: { email: true } },
      members: { include: { user: { select: { email: true } } } },
      messages: {
        where: { NOT: { readers: { has: email } } },
        include: { sender: { select: { email: true, nickname: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return res.status(RS.SUCCESS_OK).json({
    groups: groups.map((group) => ({
      _id: group.id,
      title: group.title,
      owner: group.owner.email,
      members: group.members.map((member) => member.user.email),
      groupAvatar: group.avatarUrl,
      created: group.createdAt,
      modified: group.updatedAt,
      unreadchats: group.messages.map(toLegacyGroupMessage),
    })),
  })
}
