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

  const groupMsgsCollection = client.db().collection('groupMsgs')
  const groupchatCollection = client.db().collection('groupchat')

  let message = req.body.message
  try {
    const newChatInfo = await groupMsgsCollection.insertOne({
      posterName: message.posterName,
      posterEmail: message.posterEmail,
      type: message.type,
      content: message.content,
      groupId: new ObjectId(message.groupId),
      date: timestampToFormattedDate(Date.now()),
      time: formatTime(Date.now()),
      readers: [session?.user?.email]
    });
    await groupchatCollection.updateOne({
      _id: new ObjectId(message.groupId)
    }, {
      $set: {
        modified: new Date()
      }
    });
    client.close()
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
      newChatInfo: newChatInfo
    })
  } catch(error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }

}

export default handler
