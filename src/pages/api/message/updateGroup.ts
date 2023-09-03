import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  const session = await getServerSession(req, res, authOptions)
  console.log('=====================>')
  console.log(session)

  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }

  const { groupInfo, members } = req.body;
  const client = await connectToDatabase();

  const groupchatCollection = client.db().collection('groupchat');

  try {
    const thisGroup = await groupchatCollection.find({
      _id: new ObjectId(groupInfo._id)
    }).project({
      members: 1
    }).toArray();

    const deleteMembers = thisGroup[0].members.filter((member: string) => !members.includes(member))

    console.log(groupInfo, members)
    members.map(async (member: string) => {
      await groupchatCollection.updateOne({
        _id: new ObjectId(groupInfo._id)
      }, {
        $addToSet: {
          'members': member
        }
      });
    })

    deleteMembers.map(async (member: string) => {
      await groupchatCollection.updateOne({
        _id: new ObjectId(groupInfo._id)
      }, {
        $pull: {
          'members': member
        }
      });
    })

    client.close()
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
    })
  } catch (err) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: err,
    })
  }

}

export default handler
