import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { z } from 'zod'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'

const applicationSchema = z.object({
  need_id: z.string().min(1),
  desc: z.string().trim().min(1).max(10_000),
  price: z.coerce.number().finite().min(0),
})

function connectsPerApplication() {
  const amount = Number(process.env.CONNECTS_PER_APPLICATION ?? 1)
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error('CONNECTS_PER_APPLICATION must be a positive integer.')
  }
  return amount
}

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

      const parsed = applicationSchema.safeParse(legacyBody(req.body))
      if (!parsed.success) {
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid application details.' })
      }
      const connectCost = connectsPerApplication()
      const result = await prisma.$transaction(async (transaction) => {
        const existing = await transaction.application.findUnique({
          where: {
            projectId_applicantId: {
              projectId: parsed.data.need_id,
              applicantId: account.user.id,
            },
          },
          select: { id: true },
        })
        if (existing) return { kind: 'existing' as const }

        const project = await transaction.project.findUnique({
          where: { id: parsed.data.need_id },
          select: { authorId: true, status: true },
        })
        if (!project || project.status !== 'OPEN') {
          return { kind: 'unavailable' as const }
        }
        if (project.authorId === account.user.id) {
          return { kind: 'own_project' as const }
        }

        const debit = await transaction.user.updateMany({
          where: { id: account.user.id, connects: { gte: connectCost } },
          data: { connects: { decrement: connectCost } },
        })
        if (debit.count === 0) return { kind: 'insufficient_connects' as const }

        const application = await transaction.application.create({
          data: {
            projectId: parsed.data.need_id,
            applicantId: account.user.id,
            coverLetter: parsed.data.desc,
            price: parsed.data.price,
          },
          select: { id: true },
        })
        return { kind: 'created' as const, id: application.id }
      })

      if (result.kind === 'existing') {
        return res.status(RS.SUCCESS_OK).json({ message: 'Exsit' })
      }
      if (result.kind === 'unavailable') {
        return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project is not open.' })
      }
      if (result.kind === 'own_project') {
        return res.status(403).json({ message: 'You cannot apply to your own project.' })
      }
      if (result.kind === 'insufficient_connects') {
        return res.status(402).json({
          message: `Applying requires ${connectCost} Connect${connectCost === 1 ? '' : 's'}. Buy more Connects to continue.`,
        })
      }

      return res.status(RS.SUCCESS_OK).json({
        message: 'Success',
        newApply: { id: result.id },
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return res.status(RS.SUCCESS_OK).json({ message: 'Exsit' })
      }
      console.error('Project application failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not submit application.' })
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
    const applyed = await cansCallection.find({
      author: session?.user?.email,
      need_id: data.need_id,
      status: 'pending'
    }).toArray();
    if(applyed.length > 0) {
      return res.status(RS.SUCCESS_OK).json({
        message: 'Exsit',
      })
    } else {
      const newApply = await cansCallection.insertOne({
        author: session?.user?.email,
        poster: data.poster,
        need_id: data.need_id,
        description: data.desc,
        price: data.price,
        created_at: Date.now(),
        status: 'pending'
      });
      client.close()
      return res.status(RS.SUCCESS_OK).json({
        message: 'Success',
        newApply: newApply
      })
    }
  } catch(error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }

}

export default handler
