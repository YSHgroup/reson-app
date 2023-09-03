import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb'

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
  
  const client = await connectToDatabase()

  const messagesCollection = client.db().collection('messages');

  let data = req.body;
  console.log(data.callId)
  try {
    const newCallInfo = await messagesCollection.updateOne({
      _id: new ObjectId(data.callId)
    }, {
      $set: {
        content: '2',
        read: true
      }
    });
    client.close()
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
      newCallInfo: newCallInfo
    })
  } catch(error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }

}

export default handler
