import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { toLegacyDirectMessage } from '@lib/chat-data'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Wrong HTTP Method' })
  }

  const oppositeEmail = req.body?.OppositeEmail
  if (typeof oppositeEmail !== 'string' || !oppositeEmail) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid recipient.' })
  }

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { author: { email }, recipient: { email: oppositeEmail } },
        { author: { email: oppositeEmail }, recipient: { email } },
      ],
    },
    include: { author: { select: { email: true } }, recipient: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return res.status(RS.SUCCESS_OK).json({
    msgs: messages.map(toLegacyDirectMessage),
  })
}
