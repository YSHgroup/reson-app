import {NextApiRequest , NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { z } from 'zod'
import { Prisma } from '../../../generated/prisma/client'

const saveResults = async (email: string, results: Prisma.InputJsonValue) => {
    let date = new Date()
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    const data = { results, searchedDate: `${year} / ${month} / ${day}` }
    const client = await connectToDatabase()
    const searchHistoryCollection = client.db().collection('search_history')
    try {
      await searchHistoryCollection.updateOne(
        { email: email },
        { $push: { data } },
        { upsert: true }
      )
    } catch (error) {
      throw error
    } finally {
      await client.close()
    }
  }

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method !== 'PUT') {
      res.setHeader('Allow', 'PUT')
      return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP method' })
    }
    const session : any = await getServerSession(req as any, res as any, authOptions as any)
    if(!session?.user?.email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
    const parsed = z.object({ list: z.record(z.string(), z.unknown()) }).safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ message: 'Invalid search result.' })

    try {
      const results = JSON.parse(JSON.stringify(parsed.data.list)) as Prisma.InputJsonValue
      if (process.env.DATABASE_URL) {
        const { prisma } = await import('@lib/prisma')
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
        if (!user) {
          return res.status(RS.CERROR_NOTFOUND).json({ message: 'User not found.' })
        }
        await prisma.searchHistory.create({
          data: { userId: user.id, query: results },
        })
      } else {
        await saveResults(session.user.email, results)
      }
      return res.status(RS.SUCCESS_OK).json({ message: 'Search history saved.' })
    } catch (error) {
      console.error('Could not save search history:', error)
      return res.status(RS.SERROR_INTERNAL).json({
        message: 'Could not save search history.',
      })
    }
}

export default handler