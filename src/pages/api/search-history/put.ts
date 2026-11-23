import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { z } from 'zod'
import { Prisma } from '../../../generated/prisma/client'
import { prisma } from '@lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP method' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  const parsed = z.object({ list: z.record(z.string(), z.unknown()) }).safeParse(req.body)
  if (!parsed.success) return res.status(422).json({ message: 'Invalid search result.' })

  try {
    const results = JSON.parse(JSON.stringify(parsed.data.list)) as Prisma.InputJsonValue
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) return res.status(RS.CERROR_NOTFOUND).json({ message: 'User not found.' })
    await prisma.searchHistory.create({
      data: { userId: user.id, query: results },
    })
    return res.status(RS.SUCCESS_OK).json({ message: 'Search history saved.' })
  } catch (error) {
    console.error('Could not save search history:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not save search history.' })
  }
}
