import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
var pos = require('pos');
import { authOptions } from "../auth/[...nextauth]"
import { getServerSession } from "next-auth/next"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (req.method === 'POST') {
  
    const client = await connectToDatabase()
  
    const contactsCollections = client.db().collection('contacts')
  
    const contacts = await contactsCollections.find({
      author: session?.user?.email,
    }).toArray();
    client.close();
    return res.status(RS.SUCCESS_OK).json({
      message: "Success",
      data: contacts
    })
  }
  return
}

export default handler
