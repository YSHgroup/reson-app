import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }
  const schedules = await prisma.calendarEvent.findMany({
    where: {
      OR: [{ author: { email } }, { invitee: { email } }],
    },
    include: {
      author: { select: { email: true } },
      invitee: { select: { email: true } },
    },
    orderBy: { startDate: 'asc' },
  })
  return res.status(200).json({
    message: 'Success',
    newSchedule: schedules.map((schedule) => ({
      _id: schedule.id,
      title: schedule.title,
      start: schedule.startDate,
      end: schedule.endDate,
      to: schedule.invitee?.email ?? null,
      from: schedule.author.email,
      backgroundColor: schedule.background,
      description: schedule.description,
      extendedProps: {
        id: schedule.id,
        from: schedule.author.email,
        to: schedule.invitee?.email ?? null,
        description: schedule.description,
      },
    })),
  })
}
