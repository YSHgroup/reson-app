import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount } from '@lib/project-api'
import { toLegacyProject } from '@lib/project-compat'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Method not supported' })
  }
  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
    }
    const favorites = await prisma.favorite.findMany({
      where: { userId: account.user.id },
      orderBy: { createdAt: 'desc' },
      include: { project: { include: { author: true } } },
    })
    return res.status(RS.SUCCESS_OK).json({
      favorites: favorites.map(({ project }) => toLegacyProject(project)),
    })
  } catch (error) {
    console.error('Favorite list request failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not load favorites.' })
  }
}
