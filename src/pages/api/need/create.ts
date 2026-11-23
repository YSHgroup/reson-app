import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { ProjectStatus } from '../../../generated/prisma/client'
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

      const parsed = parseProjectInput(req.body)
      if (!parsed.success) {
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: parsed.message })
      }

      await prisma.project.create({
        data: {
          ...parsed.data,
          authorId: account.user.id,
          status: ProjectStatus.OPEN,
        },
      })
      return res.status(RS.SUCCESS_OK).json({ message: 'success' })
    } catch (error) {
      console.error('Project create failed:', error)
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
  // console.log('create data --> ', fields.location)
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
