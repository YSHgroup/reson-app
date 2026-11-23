import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { z } from 'zod'
import { formatTime, timestampToFormattedDate } from '@lib/utils'

const calendarSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  bgColor: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  user: z.string().email(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  const parsed = calendarSchema.safeParse(req.body)
  if (!parsed.success || parsed.data.endDate <= parsed.data.startDate) {
    return res.status(422).json({ message: 'Invalid calendar event.' })
  }
  const data = parsed.data

  try {
    const [author, invitee] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.user.findUnique({
        where: { email: data.user.toLowerCase() },
        select: { id: true },
      }),
    ])
    if (!author) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'User not found.' })
    if (!invitee) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Invitee not found.' })

    const now = Date.now()
    const [schedule] = await prisma.$transaction([
      prisma.calendarEvent.create({
        data: {
          authorId: author.id,
          inviteeId: invitee.id,
          title: data.title,
          startDate: data.startDate,
          endDate: data.endDate,
          background: data.bgColor,
          description: data.description,
        },
      }),
      prisma.directMessage.create({
        data: {
          authorId: author.id,
          recipientId: invitee.id,
          content: 'Invitation created. You can view it on Calendar.',
          type: 'text',
          metadata: {
            date: timestampToFormattedDate(now),
            time: formatTime(now),
          },
        },
      }),
    ])
    return res.status(200).json({
      message: 'Success',
      newSchedule: {
        _id: schedule.id,
        ...schedule,
      },
    })
  } catch (error) {
    console.error('Could not save PostgreSQL calendar event:', error)
    return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not save calendar event.' })
  }
}
