import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { connectToDatabase } from '@lib/db'
import { z } from 'zod'

const settingSchema = z.object({
  language: z.number().int().min(0).max(3).optional(),
  modus: z.number().int().min(0).max(2).optional(),
  status: z.number().int().min(0).max(3).optional(),
  show_firstname: z.number().int().min(0).max(2).optional(),
  show_lastname: z.number().int().min(0).max(2).optional(),
  show_email: z.number().int().min(0).max(2).optional(),
  show_telephone: z.number().int().min(0).max(2).optional(),
  show_analyse: z.number().int().min(0).max(2).optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (!session?.user?.email) {
    return res.status(401).json({ message: 'Unauthorized.' })
  }

  const parsed = settingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({ message: 'Invalid settings.' })
  }
  const {
    language: lang,
    modus,
    status,
    show_firstname: firstname,
    show_lastname: lastname,
    show_email: email,
    show_telephone: telephone,
    show_analyse: personalAnalysis,
  } = parsed.data

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
        create: {
          userId: user.id,
          language: lang,
          modus,
          status,
          showFirstname: firstname,
          showLastname: lastname,
          showEmail: email,
          showTelephone: telephone,
          showAnalysis: personalAnalysis,
        },
        update: {
          language: lang,
          modus,
          status,
          showFirstname: firstname,
          showLastname: lastname,
          showEmail: email,
          showTelephone: telephone,
          showAnalysis: personalAnalysis,
        },
      })
      return res.json({ status: 200, setting })
    } catch (error) {
      console.error('Could not save PostgreSQL settings:', error)
      return res.status(500).json({ message: 'Could not save your settings.' })
    }
  }

  const client = await connectToDatabase()
  
  const usersCollection = client.db().collection('users')
  const settingsCollection = client.db().collection('settings')
  
  const user = await usersCollection.findOne({'email': session.user.email})
  if (!user) {
    await client.close()
    return res.status(404).json({ message: 'User not found.' })
  }
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
// console.log('setting result-->', setting)
  client.close()
  return res.json({ status: 200, setting: setting });
}

export default handler
