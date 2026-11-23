import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'
import { toLegacyApplication, toLegacyProject } from '@lib/project-compat'

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

      const body = legacyBody(req.body)
      const projectId = typeof body.need_id === 'string' ? body.need_id : ''
      const project = await prisma.project.findFirst({
        where: { id: projectId, authorId: account.user.id },
        include: { author: true },
      })
      if (!project) {
        return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })
      }

      const applications = await prisma.application.findMany({
        where: { projectId: project.id },
        include: {
          applicant: true,
          project: { include: { author: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(RS.SUCCESS_OK).json({
        message: 'Success',
        results: applications.map(toLegacyApplication),
        project: toLegacyProject(project),
      })
    } catch (error) {
      console.error('Project application list request failed:', error)
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
  const data = JSON.parse(req.body)
  const client = await connectToDatabase()
  const cansCollection = client.db().collection('cans')
  const needsCollection = client.db().collection('needs')
  const usersCollection = client.db().collection('users')
  try {
    const results = await cansCollection
      .find({
        need_id: data.need_id
      })
      .sort({ createdAt: -1 })
      .toArray();
    let needs = [];
    for (let index = 0; index < results.length; index++) {
      const element = results[index];
      const user = await usersCollection.findOne({
        email: element.author
      })
      if(user){
        needs.push({
          ...element,
          user
        })
      }
    }
    const project = await needsCollection
      .findOne({
        _id: string2ObjectId(data.need_id)
      })
    client.close()
    return res.status(200).json({
      message: 'Success',
      results: needs,
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
