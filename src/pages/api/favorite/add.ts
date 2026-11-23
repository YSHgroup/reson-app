import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody } from '@lib/project-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Method not supported' })
  }
  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
    }
    const body = legacyBody(req.body)
    const projectId = typeof body.id === 'string' ? body.id : ''
    if (!projectId) {
      return res.status(422).json({ message: 'Project id is required.' })
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })
    if (!project) {
      return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })
    }
    await prisma.favorite.upsert({
      where: { userId_projectId: { userId: account.user.id, projectId } },
      create: { userId: account.user.id, projectId },
      update: {},
    })
    return res.status(RS.SUCCESS_OK).json({ message: 'Added to favorites' })
  } catch (error) {
    console.error('Favorite add failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not add favorite.' })
  }
}
