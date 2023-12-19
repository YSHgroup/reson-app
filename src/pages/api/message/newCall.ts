import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb'
import { formatTime, timestampToFormattedDate } from "@lib/utils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const messagesCollection = client.db().collection('messages');

  let data = req.body;

  try {
    const newCallInfo = await messagesCollection.insertOne({
      author: session?.user?.email,
      type: 'voiceCall',
      content: '0',
      to: data.to,
      date: timestampToFormattedDate(Date.now()),
      time: formatTime(Date.now()),
      read: false
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
