import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions)
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
    try {
        const newSchedule = await calendarCollection.insertOne({
            author: session?.user?.email,
            title: data.title,
            startdate: data.startDate,
            enddate: data.endDate,
            bgcolor: data.bgColor,
            description: data.description
        })
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
