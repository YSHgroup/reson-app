import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@lib/prisma'

const VERIFICATION_VALIDITY_MS = 24 * 60 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  const { slug } = req.query
  if (!Array.isArray(slug) || slug.length !== 2) {
    return res.status(400).json({ error: 'Invalid verification link.' })
  }

  try {
    const [userId, verificationCode] = slug
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        verificationCode,
        verificationSentAt: { gte: new Date(Date.now() - VERIFICATION_VALIDITY_MS) },
      },
      select: { id: true },
    })
    if (!user) {
      return res.status(400).json({ error: 'Verification link is invalid or expired.' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { enabled: true, verificationCode: null, verificationSentAt: null },
    })
    return res.redirect(307, '/signin')
  } catch (error) {
    console.error('PostgreSQL email verification failed:', error)
    return res.status(500).json({ error: 'Could not verify your account.' })
  }
}
