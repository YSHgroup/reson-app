import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, unmigratedAccountMessage } from '@lib/project-api'
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

      const projects = await prisma.project.findMany({
        where: { authorId: account.user.id },
        include: { author: true, _count: { select: { applications: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(RS.SUCCESS_OK).json({
        data: projects.map((project) =>
          toLegacyProject(project, project._count.applications)
        ),
      })
    } catch (error) {
      console.error('Project list request failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not load projects.' })
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
  const myEmail = session.user?.email
  const client = await connectToDatabase()
  const needsCollection = client.db().collection('needs')

  const needs = await needsCollection
    .find({
      author: myEmail,
    })
    .toArray();
    let data = []
    const cansCollection = client.db().collection('cans');
    for (let index = 0; index < needs.length; index++) {
      const need = needs[index];
      const count = await cansCollection.countDocuments({
        need_id: String(need._id)
      })
      data.push({
        ...need,
        count: count
      })
    }
  client.close()
  return res.status(RS.SUCCESS_OK).json({
    data: data,
  })
}

export default handler
