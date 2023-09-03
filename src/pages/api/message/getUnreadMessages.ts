import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"


async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return
  }
  
  // const session = await getSession({
  //     req,
  // })
  const session = await getServerSession(req, res, authOptions)

  const client = await connectToDatabase()

  const email = session?.user?.email
  
  const messagesCollection = client.db().collection('messages');
  const groupMsgsCollection = client.db().collection('groupMsgs');
  const groupchatCollection = client.db().collection('groupchat');
  
  const unreadCount = await messagesCollection.countDocuments({
    to: email,
    read: false
  });

  const myGroups = await groupchatCollection.find({
    members: {
      $in: [email]
    }
  }, {
    projection: {
      _id: 1
    }
  }).toArray();

  const myGroupsList = myGroups.map((item) => {
    return Object.entries(item)[0][1]
  })

  const unreadGroupChats = await groupMsgsCollection.find({
    $and : [
      {
        groupId: {
        $in: [...myGroupsList]
      }
    },
      {
        readers: {
        $nin: [email]
      }
    }
    ]
  }).toArray();

  const unreadMessages = await messagesCollection.find({ 
    to: email,
    read: false
  }).toArray();

  let totalUnreadChats = unreadMessages.concat(unreadGroupChats);
  totalUnreadChats.sort((a: any, b: any) => {
    const Adate = (new Date(`${a.date} ${a.time}`)).getTime();
    const Bdate = new Date(`${b.date} ${b.time}`).getTime();
    return Bdate - Adate;
  })

  const data = {
    count: (unreadCount + unreadGroupChats.length),
    messages: unreadMessages,
    totalUnreadChats
  }


  client.close()
  return res.json({ status: 200, data: data });
}

export default handler
