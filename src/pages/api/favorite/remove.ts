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
    await prisma.favorite.deleteMany({
      where: { userId: account.user.id, projectId },
    })
    return res.status(RS.SUCCESS_OK).json({ message: 'Removed in favorites' })
  } catch (error) {
    console.error('Favorite removal failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not remove favorite.' })
  }
}
