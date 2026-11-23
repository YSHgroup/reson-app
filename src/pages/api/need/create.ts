import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { ProjectStatus } from '../../../generated/prisma/client'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, parseProjectInput } from '@lib/project-api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
    }

    const parsed = parseProjectInput(req.body)
    if (!parsed.success) {
      return res.status(RS.CERROR_UNPROCESSABLE).json({ message: parsed.message })
    }

    await prisma.project.create({
      data: {
        ...parsed.data,
        authorId: account.user.id,
        status: ProjectStatus.OPEN,
      },
    })
    return res.status(RS.SUCCESS_OK).json({ message: 'success' })
  } catch (error) {
    console.error('Project create failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ error: 'Server Error' })
  }
}
