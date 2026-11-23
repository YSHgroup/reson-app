import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { textAnalysisPattern } from 'functions/textAnalysisToSore'
import { prisma } from '@lib/prisma'
import { appendUserArtifact } from '@lib/user-artifacts'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  const email = session?.user?.email
  if (!email) return res.status(401).json({ message: 'Unauthorized.' })
  try {
    const textObj = req.body.need
    const { title, description } = textObj
    const [titleAnalysis, descriptionAnalysis] = [
      textAnalysisPattern(title, email),
      textAnalysisPattern(description, email),
    ]
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) return res.status(404).json({ message: 'User not found.' })
    await Promise.all([
      appendUserArtifact(user.id, 'project-title-analysis', titleAnalysis),
      appendUserArtifact(user.id, 'project-description-analysis', descriptionAnalysis),
    ])
    return res.status(RS.SUCCESS_OK).json({ message: 'Success' })
  } catch (error) {
    console.error('Project text analysis save failed:', error)
    return res.status(500).json({ message: 'Could not save project analysis.' })
  }
}

export default handler
