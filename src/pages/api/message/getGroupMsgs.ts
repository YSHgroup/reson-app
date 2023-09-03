import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb';

var pos = require('pos');

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions)
    if (session == undefined)
        return res.status(RS.CERROR_UNAUTHORIZED).json({
            message: 'Unauthorized',
        })

    if (req.method !== 'GET') {
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }
    const { id } : any = req.query;
    const client = await connectToDatabase()
    const groupMsgsCollection = client.db().collection('groupMsgs');

    const groupMsgs = await groupMsgsCollection.find({groupId: new ObjectId(id)}).toArray();
    client.close()
    return res.status(RS.SUCCESS_OK).json({
        groupMsgs: groupMsgs,
    })

}

export default handler
