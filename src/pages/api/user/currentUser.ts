import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { connectToDatabase } from '@lib/db'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  
  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (!session?.user?.email) {
    return res.status(401).json({ message: 'Unauthorized.' })
  }

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          nickname: true,
          firstName: true,
          lastName: true,
          company: true,
          telephone: true,
          address: true,
          profession: true,
          education: true,
          hobby: true,
          carExist: true,
          birthday: true,
          sex: true,
          picturePath: true,
          bio: true,
          settings: { select: { status: true } },
        },
      })
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found.' })
      }

      const birthday = currentUser.birthday
      return res.json({
        status: 200,
        data: {
          ...currentUser,
          picpath: currentUser.picturePath,
          day_birth: birthday?.getDate(),
          month_birth: birthday ? birthday.getMonth() + 1 : undefined,
          year_birth: birthday?.getFullYear(),
          status: currentUser.settings?.status ?? 0,
        },
      })
    } catch (error) {
      console.error('Could not load PostgreSQL user profile:', error)
      return res.status(500).json({ message: 'Could not load your profile.' })
    }
  }

  const client = await connectToDatabase()
  const usersCollection = client.db().collection('users')
  
  const currentUser = await usersCollection.findOne({'email': session?.user?.email});

  client.close()
  return res.json({ status: 200, data: currentUser });
}

export default handler
