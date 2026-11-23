import { NextApiRequest, NextApiResponse } from "next";
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { ObjectId } from "mongodb";
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (process.env.DATABASE_URL) {
        if (req.method !== 'DELETE') {
            return res.status(RS.CERROR_FORBIDDEN).json('Wrong HTTP method')
        }
        try {
            const account = await getPrismaAccount(req, res)
            if (account.status === 'unauthenticated') {
                return res.status(RS.CERROR_UNAUTHORIZED).json('Unauthorized')
            }
            if (account.status === 'unmigrated') {
                return res.status(409).json({ message: unmigratedAccountMessage() })
            }

            const data = legacyBody(req.body)
            const projectId = typeof data._id === 'string' ? data._id : ''
            if (!projectId) return res.status(422).json({ message: 'Project id is required.' })

            const deleted = await prisma.project.deleteMany({
                where: { id: projectId, authorId: account.user.id },
            })
            if (deleted.count === 0) {
                return res.status(RS.CERROR_NOTFOUND).json('Project not found.')
            }
            return res.status(RS.SUCCESS_OK).json('Deleted successfully')
        } catch (error) {
            console.error('Project deletion failed:', error)
            return res.status(RS.SERROR_INTERNAL).json('Can not delete the project.')
        }
    }

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