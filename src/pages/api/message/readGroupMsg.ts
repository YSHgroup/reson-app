import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
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

  const readchats = req.body?.readchats
  if (!Array.isArray(readchats)) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid messages.' })
  }
  const ids = readchats
    .map((chat: { _id?: unknown }) => chat?._id)
    .filter((id: unknown): id is string => typeof id === 'string')
  if (ids.length) {
    await prisma.groupMessage.updateMany({
      where: {
        id: { in: ids },
        group: { members: { some: { user: { email } } } },
      },
      data: { readers: { push: email } },
    })
  }
  return res.status(RS.SUCCESS_OK).json({ message: 'Success' })
}
