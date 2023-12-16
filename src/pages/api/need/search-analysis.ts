import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { textAnalysisPattern } from 'functions/textAnalysisPattern'
var pos = require('pos')

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }

  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )

  const client = await connectToDatabase()

  const searchTextCollection = client.db().collection('search_texts')
  let { text } = req.body
  let patternObj = textAnalysisPattern(text, session.user.email)

  await searchTextCollection.updateOne(
    { email: session.user.email },
    { $push: { text: { $each: [patternObj], $slice: -50 } } },
    { upsert: true }
  )

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
  })
}

export default handler
