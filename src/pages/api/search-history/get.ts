import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!user) return res.status(RS.CERROR_NOTFOUND).json({ message: 'User not found.' })
  const entries = await prisma.searchHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })
  return res.status(200).json({
    message: 'Success',
    history: {
      data: entries.map((entry) => ({
        results: entry.query,
        searchedDate: `${entry.createdAt.getFullYear()} / ${entry.createdAt.getMonth() + 1} / ${entry.createdAt.getDate()}`,
      })),
    },
  })
}
