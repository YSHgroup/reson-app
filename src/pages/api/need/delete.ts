import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody } from '@lib/project-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE')
    return res.status(RS.CERROR_FORBIDDEN).json('Wrong HTTP method')
  }

  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json('Unauthorized')
    }

    const data = legacyBody(req.body)
    const projectId = typeof data._id === 'string' ? data._id : ''
    if (!projectId) {
      return res.status(422).json({ message: 'Project id is required.' })
    }

    const deleted = await prisma.project.deleteMany({
      where: { id: projectId, authorId: account.user.id },
    })
    if (deleted.count === 0) {
      return res.status(RS.CERROR_NOTFOUND).json('Project not found.')
    }
    return res.status(RS.SUCCESS_OK).json('Deleted successfully')
  } catch (error) {
    console.error('Project deletion failed:', error)
    return res.status(RS.SERROR_INTERNAL).json('Can not delete the project.')
  }
}
