import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
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
  const data = JSON.parse(req.body)
  const client = await connectToDatabase()
  const needsCollection = client.db().collection('needs')
  const titleKeywords = data.title.split(" ");
  const titleQuery = titleKeywords.map((e: string) => {
    return new RegExp(e, 'i');
  })
  let query:any = [
    { exist: 1 },
    { price: { $gt: data.min * 1, $lt: data.max * 1 } },
    { author: { $ne: session?.user?.email } }
  ];
  if (data.where) {
    query.push({ where: { $regex: data.where, $options: 'i' } })
  }
  if(data.role) {
    data.role !== 'all' && query.push({ role: data.role });
  }
  if(data.payUnit) {
    data.payUnit !== 'all' && query.push({ payUnit: data.payUnit });
  }
  try {
    const results = await needsCollection
      .find({
        $and: query,
        title: { $in: titleQuery }
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
