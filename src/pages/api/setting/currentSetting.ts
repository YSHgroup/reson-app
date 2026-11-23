import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  if (!session?.user?.email) {
    return res.status(401).json({ message: 'Unauthorized.' })
  }

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
      if (!user) {
        return res.status(404).json({ message: 'User not found.' })
      }
      const setting = await prisma.setting.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      })
      return res.json({
        status: 200,
        data: {
          ...setting,
          user_id: setting.userId,
          show_firstname: setting.showFirstname,
          show_lastname: setting.showLastname,
          show_email: setting.showEmail,
          show_telephone: setting.showTelephone,
          show_analyse: setting.showAnalysis,
          show_position: 0,
        },
      })
    } catch (error) {
      console.error('Could not load PostgreSQL settings:', error)
      return res.status(500).json({ message: 'Could not load your settings.' })
    }
  }

  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')
  const settingsCollection = client.db().collection('settings')
  const currentUser = await usersCollection.findOne({
    email: session?.user?.email,
  })
  if (!currentUser) {
    await client.close()
    return res.status(404).json({ message: 'User not found.' })
  }
  // console.log('user in current: ', currentUser?._id)
  try {
    const currentSetting = await settingsCollection.findOne({
      user_id: currentUser._id,
    })
    // console.log('user current setting: ', currentSetting)

    const setting =
      currentSetting ??
      (
        await settingsCollection.findOneAndUpdate(
          { user_id: currentUser._id },
          {
            $setOnInsert: {
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
          { upsert: true, returnDocument: 'after' }
        )
      ).value

    await client.close()
    return res.json({ status: 200, data: setting })
  } catch (error) {
    await client.close()
    console.error('Could not load MongoDB settings:', error)
    return res.status(500).json({ message: 'Could not load your settings.' })
  }
}

export default handler
