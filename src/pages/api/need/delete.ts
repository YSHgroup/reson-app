import { NextApiRequest, NextApiResponse } from "next";
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { ObjectId } from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method !== 'DELETE' ) return res.status(RS.CERROR_FORBIDDEN).json('Wrong HTTP method')
    const session: any = await getServerSession(req as any, res as any, authOptions as any)
    if(!session) return res.status(RS.CERROR_UNAUTHORIZED).json('Unauthorized')
    
    const data = JSON.parse(req.body)
    const client = await connectToDatabase()
    try {
        const needCollection = client.db().collection('needs')
        const result = await needCollection.deleteOne({_id: new ObjectId(data._id)})
        if(result.deletedCount === 1){
            return res.status(RS.SUCCESS_OK).json('Deleted successfully')
        } else {
            return res.status(RS.CERROR_NOTFOUND).json('No documents matched the query. Deleted 0 doucments.')
        }
    }catch(err) {
        console.error('Project delete error: ', err)
        return res.status(RS.SERROR_INTERNAL).json('Can not delete the project.')
    }
}

export default handler