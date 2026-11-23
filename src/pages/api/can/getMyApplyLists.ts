import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount } from '@lib/project-api'
import { toLegacyApplication } from '@lib/project-compat'

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
    const applications = await prisma.application.findMany({
      where: { applicantId: account.user.id },
      include: {
        applicant: true,
        project: { include: { author: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
      results: applications.map(toLegacyApplication),
    })
  } catch (error) {
    console.error('Application list request failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not load applications.' })
  }
}
