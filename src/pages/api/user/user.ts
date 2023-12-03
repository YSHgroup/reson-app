import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { connectToDatabase } from '@lib/db'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return
  }
  
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  
  const users = await usersCollection.aggregate([
    {
      $match : {
        email: {
          $ne: session?.user?.email
        }
    }
    }, {
      $lookup: {
        from: "messages",
        let: { "author": "$email" },
        pipeline: [
          { $match: {
            $expr: {
              $and : [
                { $eq: ['$$author', '$author'] },
                { $eq: [session?.user?.email , '$to'] },
              ]
              
            }
          } }
        ],
        as: "msgs"
      }
    }, {
      $addFields: {
        unreadCount: {
          $size: {
            $filter: {
              input : '$msgs',
              as: "msg",
              cond: {
                $and : [
                  {$eq: [ "$$msg.read", false ]},
                  {$eq: [ "$$msg.to", session?.user?.email ]}
                ]
              }
            }
          }
        }
      }
    }
  ]).toArray()

  client.close()
  return res.json({ status: 200, data: users });
}

export default handler
