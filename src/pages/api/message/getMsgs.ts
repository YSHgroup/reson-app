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
    const myEmail = session.user?.email;
    const { OppositeEmail } : any = req.body;
    const client = await connectToDatabase()
    const messagesCollection = client.db().collection('messages');

    const msgs = await messagesCollection.find({
        $or:[
          {author:myEmail, to:OppositeEmail},
          {author:OppositeEmail, to:myEmail},
        ],}).toArray();
    client.close()
    return res.status(RS.SUCCESS_OK).json({
        msgs: msgs,
    })

}

export default handler
