import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@lib/db'
import { z } from 'zod'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  let body: unknown = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(422).json({ message: 'A valid email is required.' })
    }
  }
  const parsed = z.object({ email: z.string().email() }).safeParse(body)
  if (!parsed.success) {
    return res.status(422).json({ message: 'A valid email is required.' })
  }

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
        select: {
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
          settings: { select: { status: true } },
        },
      })
      if (!user) {
        return res.status(404).json({ message: 'User not found.' })
      }
      const birthday = user.birthday
      return res.json({
        status: 200,
        data: {
          ...user,
          picpath: user.picturePath,
          day_birth: birthday?.getDate(),
          month_birth: birthday ? birthday.getMonth() + 1 : undefined,
          year_birth: birthday?.getFullYear(),
          status: user.settings?.status ?? 0,
        },
      })
    } catch (error) {
      console.error('Could not load PostgreSQL user profile:', error)
      return res.status(500).json({ message: 'Could not load the profile.' })
    }
  }

  const client = await connectToDatabase()
  try {
    const user = await client
      .db()
      .collection('users')
      .findOne(
        { email: parsed.data.email.toLowerCase() },
        {
          projection: {
            email: 1,
            nickname: 1,
            firstName: 1,
            lastName: 1,
            company: 1,
            telephone: 1,
            address: 1,
            profession: 1,
            education: 1,
            hobby: 1,
            carExist: 1,
            day_birth: 1,
            month_birth: 1,
            year_birth: 1,
            sex: 1,
            picpath: 1,
            status: 1,
          },
        }
      )
    return res.json({ status: 200, data: user })
  } catch (error) {
    console.error('Could not load MongoDB user profile:', error)
    return res.status(500).json({ message: 'Could not load the profile.' })
  } finally {
    await client.close()
  }
}

export default handler
