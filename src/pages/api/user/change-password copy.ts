import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import RS from '@constants/ResponseStatus'
import { hashPassword, verifyPassword } from '@lib/auth'
import { prisma } from '@lib/prisma'
import { z } from 'zod'

const passwordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Not authenticated!' })
  const parsed = passwordSchema.safeParse(req.body)
  if (!parsed.success) return res.status(422).json({ message: 'Invalid password.' })

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  })
  if (!user) return res.status(RS.CERROR_NOTFOUND).json({ message: 'User not found.' })
  if (!(await verifyPassword(parsed.data.oldPassword, user.password))) {
    return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Invalid password.' })
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(parsed.data.newPassword) },
  })
  return res.status(RS.SUCCESS_OK).json({ message: 'Password updated!' })
}
