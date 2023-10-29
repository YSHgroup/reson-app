import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  const data = JSON.parse(req.body)
  const client = await connectToDatabase()
  const cansCollection = client.db().collection('cans')
  const needsCollection = client.db().collection('needs')
  try {
    const results = await cansCollection
      .find({
        need_id: data.need_id
      })
      .sort({ createdAt: -1 })
      .toArray()
    const project = await needsCollection
      .findOne({
        _id: string2ObjectId(data.need_id)
      })
    client.close()
    return res.status(200).json({
      message: 'Success',
      results: results,
      project: project
    })
  } catch (error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }
}

export default handler
