import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  if (!session?.user?.email)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
      if (!user) {
        return res.status(RS.CERROR_NOTFOUND).json({ message: 'User not found.' })
      }
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
    } catch (error) {
      console.error('Could not load PostgreSQL search history:', error)
      return res.status(RS.SERROR_INTERNAL).json({
        message: 'Could not load search history.',
      })
    }
  }

  const client = await connectToDatabase()
  const historyCollection = client.db().collection('search_history')
  try {
    const history = await historyCollection
      .findOne({ email: session.user.email })

    return res.status(200).json({
      message: 'Success',
      history: history,
    })
  } catch (error) {
    return res.status(RS.SERROR_INTERNAL).json({
      message: 'Could not load search history.',
    })
  } finally {
    await client.close()
  }
}

export default handler
