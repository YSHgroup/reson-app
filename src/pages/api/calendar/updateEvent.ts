import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    if (!session?.user?.email)
        return res.status(RS.CERROR_UNAUTHORIZED).json({
            message: 'Unauthorized',
        })

    if (req.method !== 'PUT') {
        res.setHeader('Allow', 'PUT')
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
            const author = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true },
            })
            if (!author) {
                return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'User not found.' })
            }

            let inviteeId: string | null | undefined
            if (data.user) {
                const invitee = await prisma.user.findUnique({
                    where: { email: data.user.toLowerCase() },
                    select: { id: true },
                })
                if (!invitee) {
                    return res.status(RS.CERROR_NOTFOUND).json({ message: 'Invitee not found.' })
                }
                inviteeId = invitee.id
            } else if (data.user === null) {
                inviteeId = null
            }

            const result = await prisma.calendarEvent.updateMany({
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
            if (result.count === 0) {
                return res.status(RS.CERROR_NOTFOUND).json({ message: 'Calendar event not found.' })
            }
            return res.status(200).json({ message: 'Success' })
        } catch (error) {
            console.error('Could not update PostgreSQL calendar event:', error)
            return res.status(RS.SERROR_INTERNAL).json({
                message: 'Could not update calendar event.',
            })
        }
    }

    const client = await connectToDatabase()
    const calendarCollection = client.db().collection('calendar');
    try {
        const filter = { _id: string2ObjectId(data._id) }; // replace 'your_document_id' with the actual _id value
        const update = { $set: { 
            startdate: data.startDate, 
            enddate: data.endDate,
            title: data.title,
            bgcolor: data.bgColor,
            to: data.user,
            description: data.description
        } };
        const updateSchedule = await calendarCollection.findOneAndUpdate(
            filter,
            update
        )
        await client.close();
        return res.status(200).json({
            message: "Success",
        })
    } catch (error) {
        await client.close()
        console.error('Could not update MongoDB calendar event:', error)
        return res.status(RS.SERROR_INTERNAL).json({
            message: 'Could not update calendar event.',
        })
    }
}

export default handler
