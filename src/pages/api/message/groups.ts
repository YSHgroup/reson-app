import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb';

var pos = require('pos');

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
  const { id } = req.query;
  const client = await connectToDatabase()
  const groupchatCollection = client.db().collection('groupchat');
  const groupMsgsCollection = client.db().collection('groupMsgs');

  if (id) {
    const group = await groupchatCollection.findOne({_id: new ObjectId(String(id))})
    client.close()
    return res.status(RS.SUCCESS_OK).json({
      group: group,
    })
  } else {
    const groups = await groupchatCollection.aggregate([
      {
        $match: {
          members: {
            $in: [session?.user?.email]
          }
        }
      },
      {
        $lookup: {
          from: 'groupMsgs',
          let: { 'relatedId': '$_id' },
          pipeline: [
            {
              $match: {
                readers: {
                  $nin: [session?.user?.email]
                }
              }
            },
            {
              $match: {
                $expr: {
                  $eq: ['$groupId', '$$relatedId']
                }
              }
            }
          ],
          as: 'unreadchats'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          groupAvatar: 1,
          owner: 1,
          members: 1,
          modified: 1,
          unreadchats: 1,
        }
      }
    ]).toArray();
  
    client.close()
    return res.status(RS.SUCCESS_OK).json({
      groups: groups,
    })
  }

}

export default handler
