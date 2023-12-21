import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase, string2ObjectId } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { error } from 'console'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return
  }
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')
  const settingsCollection = client.db().collection('settings')
  const currentUser = await usersCollection.findOne({
    email: session?.user?.email,
  })
  // console.log('user in current: ', currentUser?._id)
  try {
    const currentSetting = await settingsCollection.findOne({
      user_id: currentUser._id,
    })
    // console.log('user current setting: ', currentSetting)

    if (!currentSetting) throw new error()
    // console.log('user current setting after case of the error: ', currentSetting)

    client.close()
    return res.json({ status: 200, data: currentSetting })
  } catch (error) {
    console.error('current setting error: ', error)
    settingsCollection
      .updateOne(
        { user_id: currentUser._id },
        {
          $set: {
            language: 0,
            modus: 0,
            status: 0,
            show_firstname: 0,
            show_lastname: 0,
            show_email: 0,
            show_telephone: 0,
            show_analyse: 0,
          },
        },
        { upsert: true }
      )
      .then(async (resp) => {
        console.log('response: ', resp)
        const currentSetting = await settingsCollection.findOne({
          user_id: currentUser._id,
        })
        client.close()
        return res.json({ status: 200, data: currentSetting })
      })
  }
}

export default handler
