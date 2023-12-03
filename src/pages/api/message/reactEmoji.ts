import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb'
// import { formatTime, timestampToFormattedDate } from "@lib/utils";

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

  let { msgId, emojiId } = req.body;

  try {
    const reactedMsg = await messagesCollection.find({
      _id: new ObjectId(msgId)
    }).project({
      reactEmoji: 1
    }).toArray();
    if (reactedMsg[0].reactEmoji?.[`${emojiId}`]?.length) {
      const result = await messagesCollection.updateOne({
        _id: new ObjectId(msgId)
      }, {
        $pull: {
          [`reactEmoji.${emojiId}`]: session?.user?.email
        }
      });
      client.close();
      return res.status(RS.SUCCESS_OK).json({
        message: 'success',
        result: result
      });
    } else {
      const result = await messagesCollection.updateOne({
        _id: new ObjectId(msgId)
      }, {
        $addToSet: {
          [`reactEmoji.${emojiId}`]: session?.user?.email
        }
      });
      client.close();
      return res.status(RS.SUCCESS_OK).json({
        message: 'success',
        result: result
      });
    }
  } catch(error) {
    console.log(error)
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }

}

export default handler
