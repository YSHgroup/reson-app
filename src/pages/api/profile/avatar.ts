import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(401).json({ message: 'Unauthorized.' })
  const parsed = z.object({ picpath: z.string().max(2048).nullable() }).safeParse(req.body)
  if (!parsed.success) return res.status(422).json({ message: 'Invalid avatar path.' })

  try {
    await prisma.user.update({
      where: { email },
      data: { picturePath: parsed.data.picpath },
    })
    return res.status(RS.SUCCESS_OK).json({ message: 'success' })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ message: 'User not found.' })
    }
    console.error('Could not update profile avatar:', error)
    return res.status(500).json({ message: 'Could not update your avatar.' })
  }
}
