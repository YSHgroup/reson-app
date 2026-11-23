import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { ApplicationStatus } from '../../../generated/prisma/client'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody } from '@lib/project-api'
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
    const data = legacyBody(req.body)
    const applicationId = typeof data._id === 'string' ? data._id : ''
    const requestedStatus = data.status === 'rejected' ? 'declined' : data.status
    if (
      !applicationId ||
      (requestedStatus !== ApplicationStatus.accepted &&
        requestedStatus !== ApplicationStatus.declined)
    ) {
      return res.status(422).json({ message: 'Invalid application status.' })
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        project: { authorId: account.user.id },
      },
      select: { id: true },
    })
    if (!application) {
      return res.status(RS.CERROR_NOTFOUND).json({ message: 'Application not found.' })
    }
    const updated = await prisma.application.updateMany({
      where: {
        id: application.id,
        status: ApplicationStatus.pending,
      },
      data: { status: requestedStatus },
    })
    if (updated.count === 0) {
      return res.status(409).json({ message: 'Application has already been reviewed.' })
    }
    const result = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        applicant: true,
        project: { include: { author: true } },
      },
    })
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
      result: result ? toLegacyApplication(result) : null,
    })
  } catch (error) {
    console.error('Application review failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not update application.' })
  }
}
