import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@lib/db'
import { ObjectId } from 'mongodb';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  if (!Array.isArray(slug) || slug.length !== 2) {
    return res.status(400).json({ error: 'Invalid verification link.' })
  }

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const [userId, verificationCode] = slug
      const user = await prisma.user.findFirst({
        where: { id: userId, verificationCode },
        select: { id: true },
      })
      if (!user) {
        return res.status(400).json({ error: 'Verification link is invalid or expired.' })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { enabled: true, verificationCode: null },
      })
      return res.redirect(307, '/signin')
    } catch (error) {
      console.error('PostgreSQL email verification failed:', error)
      return res.status(500).json({ error: 'Could not verify your account.' })
    }
  }

  const client = await connectToDatabase()
  const usersCollection = client.db().collection('users')
  let user
  try {
    user = await usersCollection.findOne({ _id: new ObjectId(slug[0]) })
  } catch {
    await client.close()
    return res.status(400).json({ error: 'Invalid verification link.' })
  }

  if (user?.verify_code === slug[1]) {
    await usersCollection.updateOne(
      { _id: new ObjectId(slug[0]) },
      { $set: { enable: true, verify_code: null } }
    )
    client.close()
    return res.redirect(307, '/signin')
  } else {
    client.close()
    return res.status(400).json({ error: 'Verification link is invalid or expired.' })
  }
}

export default handler
