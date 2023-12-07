import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return
  }
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  console.log(session)
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  const settingsCollection = client.db().collection('settings')
  
  const currentUser = await usersCollection.findOne({'email': session?.user?.email});
  console.log(currentUser, 'current user');
  const currentSetting = await settingsCollection.findOne({'user_id': currentUser._id})
  console.log(currentSetting,"currentSetting")
  client.close()
  return res.json({ status: 200, data: currentSetting });
}

export default handler
