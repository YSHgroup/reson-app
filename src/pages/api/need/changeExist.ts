import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody } from '@lib/project-api'
import { toLegacyProject } from '@lib/project-compat'

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
    const data = legacyBody(req.body)
    const projectId = typeof data._id === 'string' ? data._id : ''
    if (!projectId || (data.exist !== 0 && data.exist !== 1)) {
      return res.status(422).json({ message: 'Invalid project status.' })
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, authorId: account.user.id },
      include: { author: true },
    })
    if (!project) {
      return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })
    }
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { status: data.exist === 1 ? 'OPEN' : 'CLOSED' },
      include: { author: true },
    })
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
      project: toLegacyProject(updated),
    })
  } catch (error) {
    console.error('Project status update failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not update project.' })
  }
}
