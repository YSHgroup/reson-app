import { NextApiRequest, NextApiResponse } from 'next'
// import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { ObjectId } from 'mongodb'
import { formatTime, timestampToFormattedDate } from "@lib/utils";

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
  
  const client = await connectToDatabase()

  const cansCallection = client.db().collection('cans');

  let data = req.body;

  try {
    const newApply = await cansCallection.insertOne({
      author: session?.user?.email,
      poster: data.poster,
      need_id: data.need_id,
      created_at: Date.now()
    });
    client.close()
    return res.status(RS.SUCCESS_OK).json({
      message: 'Success',
      newApply: newApply
    })
  } catch(error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }

}

export default handler
