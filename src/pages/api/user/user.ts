import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
var pos = require('pos');

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return
  }
  
  // const session = await getSession({
  //     req,
  // })
  const session = await getServerSession(req, res, authOptions)

  console.log("session=", session)
  
  //   const { message } = req.body
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  
  // const users = await usersCollection.find({'email': {$ne : session?.user?.email}}).toArray()
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
        // localField: "email",
        // foreignField: "author",
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
    }
    // , {
    //   "$unwind": "$msgs"
    // }
    // , {
    //   $match: {
    //     "msgs.to": session?.user?.email
    //   }
    // },
    // , {
    //   $redact: {
    //   $cond: {
    //      if: {
    //         $eq: [ "$to", session?.user?.email ]
    //      },
    //      then: "$$DESCEND",
    //      else: "$$PRUNE"
    //   }
    // }}
    , {
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
