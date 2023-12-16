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

  const projectText = client.db().collection('project_texts')
  let textObj = req.body.need
  let {
    title,
    description
  } = textObj

  let titleAnalysis = textAnalysisPattern(title, session?.user?.email)
  let desAnalysis = textAnalysisPattern(description, session?.user?.email)
  let patternObj = {}
  console.table(titleAnalysis)
  console.table(desAnalysis)

  await projectText.updateOne({email: session.user.email},{$push: {title_texts: titleAnalysis, des_texts: desAnalysis}}, {upsert: true})

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
  })
}

export default handler
