import { NextApiRequest, NextApiResponse } from 'next'
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
    const data = JSON.parse(req.body);
    const client = await connectToDatabase()
    const needsCollection = client.db().collection('needs');
    try {
        const results = await needsCollection.find({
            $and: [
                {

                    $or: [
                        { title: { $regex: data.title, $options: 'i' } },
                        { location: { $regex: data.location, $options: 'i' } }
                    ]
                },
                { author: { $ne: session?.user?.email } }
            ]
        }).sort({ createdAt: -1 }).toArray();

        client.close();
        return res.status(200).json({
            message: "Success",
            results: results
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

