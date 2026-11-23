import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { z } from 'zod'

const calendarSchema = z.object({
  _id: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  bgColor: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  user: z.string().email().optional().nullable(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  const parsed = calendarSchema.safeParse(req.body)
  if (!parsed.success || parsed.data.endDate <= parsed.data.startDate) {
    return res.status(422).json({ message: 'Invalid calendar event.' })
  }
  const data = parsed.data
  const author = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!author) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'User not found.' })

  let inviteeId: string | null | undefined
  if (data.user) {
    const invitee = await prisma.user.findUnique({
      where: { email: data.user.toLowerCase() },
      select: { id: true },
    })
    if (!invitee) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Invitee not found.' })
    inviteeId = invitee.id
  } else if (data.user === null) {
    inviteeId = null
  }
  const updated = await prisma.calendarEvent.updateMany({
    where: { id: data._id, authorId: author.id },
    data: {
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      background: data.bgColor,
      description: data.description,
      inviteeId,
    },
  })
  if (!updated.count) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Calendar event not found.' })
  return res.status(200).json({ message: 'Success' })
}
