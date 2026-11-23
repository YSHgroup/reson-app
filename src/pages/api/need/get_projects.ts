import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount } from '@lib/project-api'
import { toLegacyProject } from '@lib/project-compat'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }

  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
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

export default handler
