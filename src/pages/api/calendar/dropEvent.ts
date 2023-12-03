import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    if (session == undefined)
        return res.status(RS.CERROR_UNAUTHORIZED).json({
            message: 'Unauthorized',
        })

    if (req.method !== 'PUT') {
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }
    const data = req.body;
    const client = await connectToDatabase()
    const calendarCollection = client.db().collection('calendar');
    try {
        const filter = { _id: string2ObjectId(data._id) }; // replace 'your_document_id' with the actual _id value
        const update = { $set: { startdate: data.start, enddate: data.end } };
        const updateSchedule = await calendarCollection.findOneAndUpdate(
            filter,
            update
        )
        client.close();
        return res.status(200).json({
            message: "Success",
            newSchedule: updateSchedule
        })
    } catch (error) {
        client.close()
        return res.status(RS.SERROR_INTERNAL).json({
            message: error,
        })
    }
}

export default handler
