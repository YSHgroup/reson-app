import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb';

var pos = require('pos');

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }

  var today = new Date()

  const session = await getServerSession(req, res, authOptions)

  const { members, groupName, groupInfo } = req.body
  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')

  const groupchatCollection = client.db().collection('groupchat')

  try {
    await groupchatCollection.updateOne({
        _id: new ObjectId(groupInfo._id)
    },{
      $set: {
      title: groupName,
      members,
      modified: today
    }})
    client.close()
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
    })
  } catch(err) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: err,
    })
  }

}

export default handler
