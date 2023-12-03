import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase, string2ObjectId } from '@lib/db'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }
  
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  const {email} = JSON.parse(req.body)
  const user = await usersCollection.findOne({
    email: email
  })

  client.close()
  return res.json({ status: 200, data: user });
}

export default handler
