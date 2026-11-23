import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
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
    const fields = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const parsed = parseProjectInput(fields)
    if (!parsed.success) {
      return res.status(RS.CERROR_UNPROCESSABLE).json({ message: parsed.message })
    }
    const projectId = typeof fields?._id === 'string' ? fields._id : ''
    if (!projectId) {
      return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Project id is required.' })
    }

    const updated = await prisma.project.updateMany({
      where: { id: projectId, authorId: account.user.id },
      data: { ...parsed.data, status: 'OPEN' },
    })
    if (updated.count === 0) {
      return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })
    }
    return res.status(RS.SUCCESS_OK).json({ message: 'success' })
  } catch (error) {
    console.error('Project update failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ error: 'Server Error' })
  }
}
