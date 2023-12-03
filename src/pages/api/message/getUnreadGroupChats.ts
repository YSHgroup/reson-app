import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
// import { getSession } from 'next-auth/react'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"


async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'GET') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  
  const client = await connectToDatabase();

  const email = session?.user?.email;
  
  const groupchatCollection = client.db().collection('groupchat');
  const groupMsgsCollection = client.db().collection('groupMsgs');

  // const unreadCount = await groupMsgsCollection.countDocuments({
  //   readers: {
  //     $nin: [email]
  //   }
  // });

  const myGroups = await groupchatCollection.find({
    members: {
      $in: [email]
    }
  }, { projection: { _id: 1 } }).toArray();

  const unreadGroupChats = await groupMsgsCollection.find({ 
    _id: {
      $in: [...myGroups]
    },
    readers: {
      $in: [email]
    }
  }).toArray();

  const data = {
    // count: unreadCount,
    unreadGroupChats: unreadGroupChats,
  }


  client.close()
  return res.json({ status: 200, data: data });
}

export default handler
