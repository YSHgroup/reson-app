import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (session == undefined) {
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })
  }
  const client = await connectToDatabase()
  const needCollection = client.db().collection('needs')
  const fields = JSON.parse(req.body)
  try {
    const result = await needCollection.updateOne({
        _id: string2ObjectId(fields._id)
    },{
        $set: {
            author: session?.user?.email,
            title: fields.title,
            startLine: fields.startLine,
            deadLine: fields.deadLine,
            price: fields.price * 1,
            description: fields.description,
            payType: fields.payType,
            where: fields.where,
            payUnit: fields.payUnit,
            role: fields.role,
            exist: 1,
            created_at: Date.now(),
        }
    })
    client.close()
    res.status(200).send({ message: 'success' })
  } catch (error) {
    res.status(500).send({ error: 'Server Error' })
  }
}
