import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody } from '@lib/project-api'
import { toLegacyProject } from '@lib/project-compat'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }

  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
    }

    const params = legacyBody(req.body)
    const projectId = typeof params.id === 'string' ? params.id : ''
    if (!projectId) return res.status(422).json({ message: 'Project id is required.' })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { author: true },
    })
    return res.status(RS.SUCCESS_OK).json(project ? toLegacyProject(project) : null)
  } catch (error) {
    console.error('Project detail request failed:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not load project.' })
  }
}

export default handler
