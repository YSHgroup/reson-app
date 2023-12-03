import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    if (session == undefined)
        return res.status(RS.CERROR_UNAUTHORIZED).json({
            message: 'Unauthorized',
        })

    if (req.method !== 'POST') {
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }
    const data = req.body;
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
        client.close();
        return res.status(200).json({
            message: "Success",
            newSchedule: schedulesEvent
        })
    } catch (error) {
        client.close()
        return res.status(RS.SERROR_INTERNAL).json({
            message: error,
        })
    }
}

export default handler
function ArrayPush() {
    throw new Error('Function not implemented.')
}

