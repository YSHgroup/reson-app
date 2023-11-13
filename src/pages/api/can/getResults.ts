import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
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
  const needsCollection = client.db().collection('needs')
  let query = [];
  const titleKeywords = data.title.split(" ");
  let titleQuery = [];
  for (let index = 0; index < titleKeywords.length; index++) {
    const keyword = titleKeywords[index];
    titleQuery.push({
      title: {$regex: keyword, $options: 'i'}
    });
  }
  if (data.where) {
    query = [
      { where: { $regex: data.where, $options: 'i' } },
      { price: { $gt: data.min * 1, $lt: data.max * 1 } },
      { role: data.role },
      { payUnit: data.payUnit },
      { exist: 1 },
      { author: { $ne: session?.user?.email } }
    ]
  } else {
    query = [
      { price: { $gt: data.min * 1, $lt: data.max * 1 } },
      { role: data.role },
      { payUnit: data.payUnit },
      { exist: 1 },
      { author: { $ne: session?.user?.email } }
    ]
  }
  try {
    const results = await needsCollection
      .find({
        $and: query,
        $or: titleQuery
      })
      .sort({ createdAt: -1 })
      .toArray()

    client.close()
    return res.status(200).json({
      message: 'Success',
      results: results,
    })
  } catch (error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }
}

export default handler
