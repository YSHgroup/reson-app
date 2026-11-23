import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'
import { toLegacyProject } from '@lib/project-compat'

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.DATABASE_URL) {
        if (req.method !== 'POST') {
            return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
        }
        try {
            const account = await getPrismaAccount(req, res)
            if (account.status === 'unauthenticated') {
                return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
            }
            if (account.status === 'unmigrated') {
                return res.status(409).json({ message: unmigratedAccountMessage() })
            }

            const data = legacyBody(req.body)
            const projectId = typeof data._id === 'string' ? data._id : ''
            if (!projectId || (data.exist !== 0 && data.exist !== 1)) {
                return res.status(422).json({ message: 'Invalid project status.' })
            }

            const project = await prisma.project.findFirst({
                where: { id: projectId, authorId: account.user.id },
                include: { author: true },
            })
            if (!project) {
                return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })
            }

            const updated = await prisma.project.update({
                where: { id: project.id },
                data: { status: data.exist === 1 ? 'OPEN' : 'CLOSED' },
                include: { author: true },
            })
            return res.status(RS.SUCCESS_OK).json({
                message: 'Success',
                project: toLegacyProject(updated),
            })
        } catch (error) {
            console.error('Project status update failed:', error)
            return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not update project.' })
        }
    }

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
