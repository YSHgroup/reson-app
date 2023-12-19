import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { textAnalysisPattern } from 'functions/textAnalysisToSore'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }

  const session: any = await getServerSession(req as any, res as any, authOptions as any)

  const client = await connectToDatabase()

  const messageCollection = client.db().collection('messagestagger')

  let message = req.body.message

  let messageAnalysis = textAnalysisPattern(message, session?.user?.email)
  console.table(messageAnalysis)

  await messageCollection.updateOne(
    { email: session.user.email },
    {
      $push: {
        texts: { $each: [messageAnalysis], $slice: -50 },
      },
    },
    { upsert: true }
  )

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
  })
}

export default handler
