import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { authOptions } from "../auth/[...nextauth]"
import { getServerSession } from "next-auth/next"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
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
