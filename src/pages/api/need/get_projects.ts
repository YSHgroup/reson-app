import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

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
  const myEmail = session.user?.email
  const client = await connectToDatabase()
  const needsCollection = client.db().collection('needs')

  const needs = await needsCollection
    .find({
      author: myEmail,
    })
    .toArray();
    let data = []
    const cansCollection = client.db().collection('cans');
    for (let index = 0; index < needs.length; index++) {
      const need = needs[index];
      const count = await cansCollection.countDocuments({
        need_id: String(need._id)
      })
      data.push({
        ...need,
        count: count
      })
    }
  client.close()
  return res.status(RS.SUCCESS_OK).json({
    data: data,
  })
}

export default handler
