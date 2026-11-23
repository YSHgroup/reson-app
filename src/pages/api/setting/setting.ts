import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { z } from 'zod'

const settingSchema = z.object({
  language: z.number().int().min(0).max(3).optional(),
  modus: z.number().int().min(0).max(2).optional(),
  status: z.number().int().min(0).max(3).optional(),
  show_firstname: z.number().int().min(0).max(2).optional(),
  show_lastname: z.number().int().min(0).max(2).optional(),
  show_email: z.number().int().min(0).max(2).optional(),
  show_telephone: z.number().int().min(0).max(2).optional(),
  show_analyse: z.number().int().min(0).max(2).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(401).json({ message: 'Unauthorized.' })
  const parsed = settingSchema.safeParse(req.body)
  if (!parsed.success) return res.status(422).json({ message: 'Invalid settings.' })

  const {
    language: language,
    modus,
    status,
    show_firstname: showFirstname,
    show_lastname: showLastname,
    show_email: showEmail,
    show_telephone: showTelephone,
    show_analyse: showAnalysis,
  } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  const setting = await prisma.setting.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      language,
      modus,
      status,
      showFirstname,
      showLastname,
      showEmail,
      showTelephone,
      showAnalysis,
    },
    update: {
      language,
      modus,
      status,
      showFirstname,
      showLastname,
      showEmail,
      showTelephone,
      showAnalysis,
    },
  })
  return res.json({ status: 200, setting })
}
