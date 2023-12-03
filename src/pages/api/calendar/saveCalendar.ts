import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

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
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }
    const data = req.body;
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
        client.close();
        return res.status(200).json({
            message: "Success",
            newSchedule: newSchedule
        })
    } catch (error) {
        client.close()
        return res.status(RS.SERROR_INTERNAL).json({
            message: error,
        })
    }
}

export default handler
