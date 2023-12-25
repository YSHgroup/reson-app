import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
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
  console.log('create data --> ', fields.location)
  try {
    const result = await needCollection.insertOne({
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
      location: fields.location,
      file: null,
      exist: 1,
      created_at: Date.now(),
    })
    client.close()
    res.status(200).send({ message: 'success' })
  } catch (error) {
    res.status(500).send({ error: 'Server Error' })
  }
}
