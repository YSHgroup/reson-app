import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { z } from 'zod'

const dropSchema = z.object({
  _id: z.string().min(1),
  start: z.coerce.date(),
  end: z.coerce.date(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  const parsed = dropSchema.safeParse(req.body)
  if (!parsed.success || parsed.data.end <= parsed.data.start) {
    return res.status(422).json({ message: 'Invalid calendar event.' })
  }
  const author = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!author) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'User not found.' })
  const updated = await prisma.calendarEvent.updateMany({
    where: { id: parsed.data._id, authorId: author.id },
    data: { startDate: parsed.data.start, endDate: parsed.data.end },
  })
  if (!updated.count) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Calendar event not found.' })
  return res.status(200).json({ message: 'Success' })
}
