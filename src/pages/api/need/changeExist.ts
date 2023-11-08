import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb'
import { formatTime, timestampToFormattedDate } from "@lib/utils";

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

    const client = await connectToDatabase()

    const needsCallection = client.db().collection('needs');

    let data = JSON.parse(req.body);
    try {
        const update = await needsCallection.updateOne({
            _id: string2ObjectId(data._id)
        }, {
            $set: {exist: data.exist}
        });
        const result = await needsCallection.findOne({
            _id: string2ObjectId(data._id)
        })
        client.close()
        return res.status(RS.SUCCESS_OK).json({
            message: 'Success',
            project: result
        })
    } catch (error) {
        client.close()
        return res.status(RS.SERROR_INTERNAL).json({
            message: error,
        })
    }

}

export default handler
