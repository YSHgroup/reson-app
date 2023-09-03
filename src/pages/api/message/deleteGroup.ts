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

  const { groupInfo } = req.body;

  const session = await getServerSession(req, res, authOptions);
  if (session?.user?.email ==! groupInfo.owner) {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'You do not have the permission.'
    })
  }
  

  const client = await connectToDatabase()

  const groupchatCollection = client.db().collection('groupchat')

  try {
    await groupchatCollection.deleteOne({
        _id: new ObjectId(groupInfo._id)
    })
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
