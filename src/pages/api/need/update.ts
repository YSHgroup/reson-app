import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, parseProjectInput, unmigratedAccountMessage } from '@lib/project-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.DATABASE_URL) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ message: 'Method not allowed.' })
    }

    try {
      const account = await getPrismaAccount(req, res)
      if (account.status === 'unauthenticated') {
        return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
      }
      if (account.status === 'unmigrated') {
        return res.status(409).json({ message: unmigratedAccountMessage() })
      }

      const fields =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = parseProjectInput(fields)
      if (!parsed.success) {
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: parsed.message })
      }
      const projectId = typeof fields?._id === 'string' ? fields._id : ''
      if (!projectId) {
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Project id is required.' })
      }

      const updated = await prisma.project.updateMany({
        where: { id: projectId, authorId: account.user.id },
        data: { ...parsed.data, status: 'OPEN' },
      })
      if (updated.count === 0) {
        return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })
      }
      return res.status(RS.SUCCESS_OK).json({ message: 'success' })
    } catch (error) {
      console.error('Project update failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ error: 'Server Error' })
    }
  }

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
