import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { z } from 'zod'

const calendarSchema = z.object({
    title: z.string().trim().min(1).max(200),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    bgColor: z.string().max(50).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    user: z.string().email(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    var today = new Date()
    var Y = today.getFullYear()
    var M = today.getMonth() + 1
    var D = today.getDate()
    var h = today.getHours()
    var m = today.getMinutes()
    var s = today.getSeconds()
    var current_date = Y + '/' + M + '/' + D
    var current_time = h + ':' + m + ':' + s
    if (session == undefined)
        return res.status(RS.CERROR_UNAUTHORIZED).json({
            message: 'Unauthorized',
        })

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }
    const parsed = calendarSchema.safeParse(req.body)
    if (!parsed.success || (parsed.success && parsed.data.endDate <= parsed.data.startDate)) {
        return res.status(422).json({ message: 'Invalid calendar event.' })
    }
    const data = parsed.data

    if (process.env.DATABASE_URL) {
        try {
            const { prisma } = await import('@lib/prisma')
            const [author, invitee] = await Promise.all([
                prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true },
                }),
                prisma.user.findUnique({
                    where: { email: data.user.toLowerCase() },
                    select: { id: true },
                }),
            ])
            if (!author) {
                return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'User not found.' })
            }
            if (!invitee) {
                return res.status(RS.CERROR_NOTFOUND).json({ message: 'Invitee not found.' })
            }
            const newSchedule = await prisma.calendarEvent.create({
                data: {
                    authorId: author.id,
                    inviteeId: invitee.id,
                    title: data.title,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    background: data.bgColor,
                    description: data.description,
                },
            })
            return res.status(200).json({
                message: 'Success',
                newSchedule,
            })
        } catch (error) {
            console.error('Could not save PostgreSQL calendar event:', error)
            return res.status(RS.SERROR_INTERNAL).json({
                message: 'Could not save calendar event.',
            })
        }
    }

    const client = await connectToDatabase()
    const calendarCollection = client.db().collection('calendar');
    const messagesCollection = client.db().collection('messages');
    try {
        const newSchedule = await calendarCollection.insertOne({
            author: session?.user?.email,
            title: data.title,
            startdate: data.startDate,
            enddate: data.endDate,
            bgcolor: data.bgColor,
            to: data.user,
            description: data.description
        })
        let messageObj: any = {};
        messageObj['author'] = session?.user?.email;
        messageObj['content'] = "Invitation created. You can view it on Calendar.";
        messageObj['to'] = data.user;
        messageObj['date'] = current_date;
        messageObj['time'] = current_time;
        messageObj['read'] = false;
        messageObj['type'] = 'text';
        await messagesCollection.insertOne(messageObj);
        await client.close();
        return res.status(200).json({
            message: "Success",
            newSchedule: newSchedule
        })
    } catch (error) {
        await client.close()
        console.error('Could not save MongoDB calendar event:', error)
        return res.status(RS.SERROR_INTERNAL).json({
            message: 'Could not save calendar event.',
        })
    }
}

export default handler
