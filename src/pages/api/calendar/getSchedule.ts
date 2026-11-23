import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    if (!session?.user?.email)
        return res.status(RS.CERROR_UNAUTHORIZED).json({
            message: 'Unauthorized',
        })

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }

    if (process.env.DATABASE_URL) {
        try {
            const { prisma } = await import('@lib/prisma')
            const schedules = await prisma.calendarEvent.findMany({
                where: {
                    OR: [
                        { author: { email: session.user.email } },
                        { invitee: { email: session.user.email } },
                    ],
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
        } catch (error) {
            console.error('Could not load PostgreSQL calendar events:', error)
            return res.status(RS.SERROR_INTERNAL).json({
                message: 'Could not load calendar events.',
            })
        }
    }

    const client = await connectToDatabase()
    const calendarCollection = client.db().collection('calendar');
    const author = session?.user?.email;
    try {
        const schedules = await calendarCollection.find({
            $or:[
                {author: author},
                {to: author}
            ]
        }).toArray();
        const schedulesEvent = [];

        for (let i = 0; i < schedules.length; i++) {
            let item = {
                'title': schedules[i].title,
                'start': schedules[i].startdate,
                'end': schedules[i].enddate,
                'to' : schedules[i].to,
                'from': schedules[i].author,
                'backgroundColor': schedules[i].bgcolor,
                'description': schedules[i].description,
                'extendedProps': { id: schedules[i]._id },
            }
            schedulesEvent.push(item);
        }
        await client.close();
        return res.status(200).json({
            message: "Success",
            newSchedule: schedulesEvent
        })
    } catch (error) {
        await client.close()
        console.error('Could not load MongoDB calendar events:', error)
        return res.status(RS.SERROR_INTERNAL).json({
            message: 'Could not load calendar events.',
        })
    }
}

export default handler
