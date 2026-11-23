import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ApplicationStatus } from '../../../generated/prisma/client'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'
import { toLegacyApplication } from '@lib/project-compat'

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
            const applicationId = typeof data._id === 'string' ? data._id : ''
            const requestedStatus =
                data.status === 'rejected' ? 'declined' : data.status
            if (
                !applicationId ||
                (requestedStatus !== ApplicationStatus.accepted &&
                    requestedStatus !== ApplicationStatus.declined)
            ) {
                return res.status(422).json({ message: 'Invalid application status.' })
            }

            const application = await prisma.application.findFirst({
                where: {
                    id: applicationId,
                    project: { authorId: account.user.id },
                },
                select: { id: true },
            })
            if (!application) {
                return res.status(RS.CERROR_NOTFOUND).json({ message: 'Application not found.' })
            }

            const updated = await prisma.application.updateMany({
                where: {
                    id: application.id,
                    status: ApplicationStatus.pending,
                },
                data: { status: requestedStatus },
            })
            if (updated.count === 0) {
                return res.status(409).json({ message: 'Application has already been reviewed.' })
            }

            const result = await prisma.application.findUnique({
                where: { id: application.id },
                include: {
                    applicant: true,
                    project: { include: { author: true } },
                },
            })
            return res.status(RS.SUCCESS_OK).json({
                message: 'Success',
                result: result ? toLegacyApplication(result) : null,
            })
        } catch (error) {
            console.error('Application review failed:', error)
            return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not update application.' })
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
