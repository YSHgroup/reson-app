import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@lib/prisma'

const VERIFICATION_VALIDITY_MS = 24 * 60 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const { verificationCode, tempEmail } = req.body ?? {}
  if (typeof verificationCode !== 'string' || typeof tempEmail !== 'string') {
    return res.status(400).json({ status: 400, msg: 'fail' })
  }

  const user = await prisma.user.findFirst({
    where: {
      email: tempEmail.trim().toLowerCase(),
      verificationCode,
      verificationSentAt: { gte: new Date(Date.now() - VERIFICATION_VALIDITY_MS) },
    },
    select: { id: true },
  })
  if (!user) return res.status(404).json({ status: 404, msg: 'fail' })
  await prisma.user.update({
    where: { id: user.id },
    data: { enabled: true, verificationCode: null, verificationSentAt: null },
  })
  return res.json({ status: 200, msg: 'success' })
}
