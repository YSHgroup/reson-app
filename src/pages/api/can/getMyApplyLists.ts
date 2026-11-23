import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, unmigratedAccountMessage } from '@lib/project-api'
import { toLegacyApplication } from '@lib/project-compat'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.DATABASE_URL) {
    if (req.method !== 'POST') {
      return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
    }

    try {
      const account = await getPrismaAccount(req, res)
      if (account.status === 'unauthenticated') {
        return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
      }
      if (account.status === 'unmigrated') {
        return res.status(409).json({ message: unmigratedAccountMessage() })
      }

      const applications = await prisma.application.findMany({
        where: { applicantId: account.user.id },
        include: {
          applicant: true,
          project: { include: { author: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(RS.SUCCESS_OK).json({
        message: 'Success',
        results: applications.map(toLegacyApplication),
      })
    } catch (error) {
      console.error('Application list request failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not load applications.' })
    }
  }

  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  const client = await connectToDatabase()
  const cansCollection = client.db().collection('cans')
  const needsCollection = client.db().collection('needs')
  try {
    const results = await cansCollection
      .find({
        author: session.user.email,
        need_id: { $ne: null },
      })
      .sort({ createdAt: -1 })
      .toArray()
    const data = []
    for (let index = 0; index < results.length; index++) {
      let need_id = results[index].need_id
      const need = await needsCollection.findOne({
        _id: string2ObjectId(need_id),
      })
      results[index].need_id = need
      data.push(results[index])
    }

    client.close()
    return res.status(200).json({
      message: 'Success',
      results: data,
    })
  } catch (error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }
}

export default handler
