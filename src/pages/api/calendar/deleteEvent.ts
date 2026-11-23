import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { z } from 'zod'

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
    const parsed = z.object({ _id: z.string().min(1) }).safeParse(req.body)
    if (!parsed.success) {
        return res.status(422).json({ message: 'Invalid calendar event.' })
    }

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
            const result = await prisma.calendarEvent.deleteMany({
                where: { id: parsed.data._id, authorId: author.id },
            })
            if (result.count === 0) {
                return res.status(RS.CERROR_NOTFOUND).json({ message: 'Calendar event not found.' })
            }
            return res.status(200).json({ message: 'Success' })
        } catch (error) {
            console.error('Could not delete PostgreSQL calendar event:', error)
            return res.status(RS.SERROR_INTERNAL).json({
                message: 'Could not delete calendar event.',
            })
        }
    }

    const client = await connectToDatabase()
    const calendarCollection = client.db().collection('calendar');
    try {
        const schedules = await calendarCollection.deleteOne({
            _id: string2ObjectId(parsed.data._id)
        });
        await client.close();
        return res.status(200).json({
            message: "Success",
        })
    } catch (error) {
        await client.close()
        console.error('Could not delete MongoDB calendar event:', error)
        return res.status(RS.SERROR_INTERNAL).json({
            message: 'Could not delete calendar event.',
        })
    }
}

export default handler
