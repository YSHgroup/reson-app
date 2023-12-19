import { NextApiRequest, NextApiResponse } from 'next'
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

    if (req.method !== 'POST') {
        return res.status(RS.CERROR_FORBIDDEN).json({
            message: 'Wrong HTTP Method',
        })
    }

    const client = await connectToDatabase()

    const cansCallection = client.db().collection('cans');

    let data = JSON.parse(req.body);
    try {
        const update = await cansCallection.updateOne({
            _id: string2ObjectId(data._id)
        }, {
            $set: {status: data.status}
        });
        const result = await cansCallection.findOne({
            _id: string2ObjectId(data._id)
        })
        client.close()
        return res.status(RS.SUCCESS_OK).json({
            message: 'Success',
            result: result
        })
    } catch (error) {
        client.close()
        return res.status(RS.SERROR_INTERNAL).json({
            message: error,
        })
    }

}

export default handler
