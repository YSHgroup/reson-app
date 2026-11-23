import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { formatTime, timestampToFormattedDate } from '@lib/utils'
import { z } from 'zod'

const reminderText =
  "Hi \n Just wanted to remind you that you have plans coming up in the next 5 minutes. \n Don't forget to get ready and be there on time! \n Have a great time!"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  const parsed = z.object({
    currentDate: z.coerce.date(),
    plusFiveMinutes: z.coerce.date(),
  }).safeParse(req.body)
  if (!parsed.success || parsed.data.plusFiveMinutes < parsed.data.currentDate) {
    return res.status(422).json({ message: 'Invalid reminder window.' })
  }

  const schedules = await prisma.calendarEvent.findMany({
    where: {
      OR: [{ author: { email } }, { invitee: { email } }],
      startDate: { gte: parsed.data.currentDate, lte: parsed.data.plusFiveMinutes },
      inviteeId: { not: null },
    },
    include: {
      author: { select: { id: true, email: true } },
      invitee: { select: { id: true } },
    },
  })
  const now = Date.now()
  for (const schedule of schedules) {
    if (!schedule.invitee) continue
    const existing = await prisma.directMessage.findFirst({
      where: {
        authorId: schedule.author.id,
        recipientId: schedule.invitee.id,
        content: reminderText,
      },
      select: { id: true },
    })
    if (!existing) {
      await prisma.directMessage.create({
        data: {
          authorId: schedule.author.id,
          recipientId: schedule.invitee.id,
          content: reminderText,
          type: 'text',
          metadata: {
            date: timestampToFormattedDate(parsed.data.currentDate),
            time: formatTime(now),
          },
        },
      })
    }
  }
  return res.status(200).json({ message: 'Success' })
}
