import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { ObjectId } from 'mongodb'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'
import { toLegacyProject } from '@lib/project-compat'

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

      const params = legacyBody(req.body)
      const projectId = typeof params.id === 'string' ? params.id : ''
      if (!projectId) return res.status(422).json({ message: 'Project id is required.' })

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { author: true },
      })
      return res.status(RS.SUCCESS_OK).json(project ? toLegacyProject(project) : null)
    } catch (error) {
      console.error('Project detail request failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not load project.' })
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
  const params = JSON.parse(req.body)
  const client = await connectToDatabase()
  const needsCollection = client.db().collection('needs')

  const needs = await needsCollection.findOne({
      _id: new ObjectId(params.id),
    })
  client.close()
  return res.status(RS.SUCCESS_OK).json(needs)
}

export default handler
