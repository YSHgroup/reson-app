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
    const { id } = req.query;
    const client = await connectToDatabase()
    const groupchatCollection = client.db().collection('groupchat');
    const usersCollection = client.db().collection('users');

    const groupMsgs = await groupchatCollection.findOne({ _id: new ObjectId(String(id)) });
    const members = await usersCollection.find({
        email: {
            $in: [...groupMsgs?.members]
        }
    }, {
        projection: {
            _id: 1,
            email: 1,
            nickname: 1,
            picpath: 1
        }
    }).toArray();
    client.close();
    return res.status(RS.SUCCESS_OK).json({
        members: members,
    })

}

export default handler
