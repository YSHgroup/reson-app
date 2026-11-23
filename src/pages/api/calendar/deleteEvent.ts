import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  const parsed = z.object({ _id: z.string().min(1) }).safeParse(req.body)
  if (!parsed.success) return res.status(422).json({ message: 'Invalid calendar event.' })
  const author = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!author) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'User not found.' })
  const result = await prisma.calendarEvent.deleteMany({
    where: { id: parsed.data._id, authorId: author.id },
  })
  if (!result.count) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Calendar event not found.' })
  return res.status(200).json({ message: 'Success' })
}
