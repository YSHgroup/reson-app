import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { connectToDatabase } from '@lib/db'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }
  const session: any = await getServerSession(req as any, res as any, authOptions as any)

  // console.log("session=", session)
  const { language: lang, modus, status, show_firstname: firstname, show_lastname: lastname, show_email: email, show_telephone: telephone, show_analyse: personalAnalysis } = req.body
  console.log('request:: ', lang, modus, status, firstname, lastname, email, telephone, personalAnalysis)
  
  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  const settingsCollection = client.db().collection('settings')
  
  const user = await usersCollection.findOne({'email': session?.user?.email})
  const setting = await settingsCollection.updateOne(
    {'user_id': user._id},
    {
      $set: {
        language: lang,
        modus: modus,
        status: status,
        show_firstname: firstname,
        show_lastname: lastname,
        show_email: email,
        show_telephone: telephone,
        show_analyse: personalAnalysis,
      }
    }
  )

  client.close()
  return res.json({ status: 200, setting: setting });
}

export default handler
