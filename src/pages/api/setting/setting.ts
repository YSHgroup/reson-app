import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { connectToDatabase } from '@lib/db'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }
  const session: any = await getServerSession(req as any, res as any, authOptions as any)

  const { language: lang, modus, status, show_firstname: firstname, show_lastname: lastname, show_email: email, show_telephone: telephone, show_analyse: personalAnalysis } = req.body
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  const settingsCollection = client.db().collection('settings')
  
  const user = await usersCollection.findOne({'email': session?.user?.email})
  const setting = await settingsCollection.updateOne(
    {'user_id': user._id},
    {
      $set: {
        language: lang?? 0,
        modus: modus?? 0,
        status: status?? 0,
        show_firstname: firstname?? 0,
        show_lastname: lastname?? 0,
        show_email: email?? 0,
        show_telephone: telephone?? 0,
        show_analyse: personalAnalysis?? 0,
      }
    },
    {upsert: true}
  )
  client.close()
  return res.json({ status: 200, setting: setting });
}

export default handler
