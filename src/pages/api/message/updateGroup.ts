import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { ObjectId } from 'mongodb'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  var today = new Date()
  const { groupInfo, people, groupName } = req.body
  const members = [
    session?.user?.email,
    ...people.map((onePeople: { email: any }) => onePeople.email),
  ]
  const client = await connectToDatabase()

  const groupchatCollection = client.db().collection('groupchat')

  try {
    await groupchatCollection.updateOne(
      {
        _id: new ObjectId(groupInfo._id),
      },
      {
        $set: {
          title: groupName,
          members,
          modified: today,
        },
      }
    )
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
