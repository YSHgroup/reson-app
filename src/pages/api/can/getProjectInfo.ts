import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody } from '@lib/project-api'
import { toLegacyApplication, toLegacyProject } from '@lib/project-compat'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
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
