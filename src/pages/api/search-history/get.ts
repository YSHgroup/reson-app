import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { MongoClient } from 'mongodb'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'GET') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  const client = await connectToDatabase()
  const historyCollection = client.db().collection('search_history')
  try {
    const history = await historyCollection
      .findOne({ email: session.user.email })

    client.close()
    return res.status(200).json({
      message: 'Success',
      history: history,
    })
  } catch (error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }
}

export default handler
