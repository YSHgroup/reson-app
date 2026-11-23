import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const session: any = await getServerSession(req as any, res as any, authOptions as any)
  if (!session?.user?.email) {
    return res.status(401).json({ message: 'Unauthorized.' })
  }

  const picpath = req.body?.picpath

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const result = await prisma.user.updateMany({
        where: { email: session.user.email },
        data: { picturePath: typeof picpath === 'string' ? picpath : null },
      })
      if (result.count === 0) {
        return res.status(404).json({ message: 'User not found.' })
      }
      return res.status(RS.SUCCESS_OK).json({ message: 'success' })
    } catch (error) {
      console.error('Could not update PostgreSQL profile avatar:', error)
      return res.status(500).json({ message: 'Could not update your avatar.' })
    }
  }

  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')

  await usersCollection.updateOne(
    {
      email: session?.user?.email,
    },
    {
      $set: {
        picpath: picpath
      },
    }
  )

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message: "success",
  })
}

export default handler
