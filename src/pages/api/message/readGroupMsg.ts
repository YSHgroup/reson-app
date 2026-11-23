import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { Document, ObjectId } from 'mongodb'

type GroupMessage = Document & {
  readers?: string[]
}

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
  const email = session?.user?.email
  if (typeof email !== 'string') {
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })
  }

  const groupMsgsCollection = client.db().collection<GroupMessage>('groupMsgs')

  const readchats = req.body.readchats;
  const readChatsIds = readchats.map((chat: any) => new ObjectId(chat._id))
  try {
    await groupMsgsCollection.updateMany(
      { _id: { $in: readChatsIds } },
      [
        {
          $set: {
            readers: {
              $setUnion: [{ $ifNull: ['$readers', []] }, [email]],
            },
          },
        },
      ]
    )
    client.close()
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
    })
  } catch(error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }

}

export default handler
