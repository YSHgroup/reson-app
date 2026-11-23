import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
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
  const group = await prisma.chatGroup.findFirst({
    where: { id: groupId, members: { some: { user: { email } } } },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, nickname: true, picturePath: true },
          },
        },
      },
    },
  })
  if (!group) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Group not found.' })

  return res.status(RS.SUCCESS_OK).json({
    members: group.members.map(({ user }) => ({
      _id: user.id,
      email: user.email,
      nickname: user.nickname,
      picpath: user.picturePath,
    })),
  })
}
