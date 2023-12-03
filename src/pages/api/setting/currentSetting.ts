import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return
  }
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  const settingsCollection = client.db().collection('settings')
  
  const currentUser = await usersCollection.findOne({'email': session?.user?.email});
  const currentSetting = await settingsCollection.find({'user_id': currentUser._id}).toArray()
  client.close()
  return res.json({ status: 200, data: currentSetting });
}

export default handler
