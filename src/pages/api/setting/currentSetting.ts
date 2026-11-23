import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(401).json({ message: 'Unauthorized.' })
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!user) return res.status(404).json({ message: 'User not found.' })

  const setting = await prisma.setting.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  })
  return res.json({
    status: 200,
    data: {
      ...setting,
      user_id: setting.userId,
      show_firstname: setting.showFirstname,
      show_lastname: setting.showLastname,
      show_email: setting.showEmail,
      show_telephone: setting.showTelephone,
      show_analyse: setting.showAnalysis,
      show_position: 0,
    },
  })
}
