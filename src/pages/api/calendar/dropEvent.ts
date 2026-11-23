import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { z } from 'zod'

const dropSchema = z.object({
    _id: z.string().min(1),
    start: z.coerce.date(),
    end: z.coerce.date(),
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
    const parsed = dropSchema.safeParse(req.body)
    if (!parsed.success || (parsed.success && parsed.data.end <= parsed.data.start)) {
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
            const result = await prisma.calendarEvent.updateMany({
                where: { id: data._id, authorId: author.id },
                data: { startDate: data.start, endDate: data.end },
            })
            if (result.count === 0) {
                return res.status(RS.CERROR_NOTFOUND).json({ message: 'Calendar event not found.' })
            }
            return res.status(200).json({ message: 'Success' })
        } catch (error) {
            console.error('Could not move PostgreSQL calendar event:', error)
            return res.status(RS.SERROR_INTERNAL).json({
                message: 'Could not update calendar event.',
            })
        }
    }

    const client = await connectToDatabase()
    const calendarCollection = client.db().collection('calendar');
    try {
        const filter = { _id: string2ObjectId(data._id) }; // replace 'your_document_id' with the actual _id value
        const update = { $set: { startdate: data.start, enddate: data.end } };
        const updateSchedule = await calendarCollection.findOneAndUpdate(
            filter,
            update
        )
        await client.close();
        return res.status(200).json({
            message: "Success",
            newSchedule: updateSchedule
        })
    } catch (error) {
        await client.close()
        console.error('Could not move MongoDB calendar event:', error)
        return res.status(RS.SERROR_INTERNAL).json({
            message: 'Could not update calendar event.',
        })
    }
}

export default handler
