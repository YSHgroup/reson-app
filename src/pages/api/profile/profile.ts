import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import RS from '@constants/ResponseStatus'
import { authOptions } from '../auth/[...nextauth]'
import { connectToDatabase } from '@lib/db'
var randomGeoHash = require('random-geohash')
import { z } from 'zod'

const profileSchema = z.object({
  firstName: z.string().max(120).optional().nullable(),
  lastName: z.string().max(120).optional().nullable(),
  company: z.string().max(160).optional().nullable(),
  telephone: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  profession: z.string().max(120).optional().nullable(),
  education: z.string().max(300).optional().nullable(),
  hobby: z.string().max(300).optional().nullable(),
  carExist: z.string().max(40).optional().nullable(),
  day_birth: z.number().int().min(1).max(31),
  month_birth: z.number().int().min(1).max(12),
  year_birth: z.number().int().min(1900).max(new Date().getFullYear()),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session : any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  if (!session?.user?.email) {
    return res.status(401).json({ message: 'Unauthorized.' })
  }

  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({ message: 'Invalid profile details.' })
  }
  const {
    firstName,
    lastName,
    company,
    telephone,
    address,
    profession,
    education,
    hobby,
    carExist,
    day_birth,
    month_birth,
    year_birth,
  } = parsed.data

  const birthday = new Date(year_birth, month_birth - 1, day_birth)
  if (
    birthday.getFullYear() !== year_birth ||
    birthday.getMonth() !== month_birth - 1 ||
    birthday.getDate() !== day_birth
  ) {
    return res.status(422).json({ message: 'Invalid birth date.' })
  }

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@lib/prisma')
      const result = await prisma.user.updateMany({
        where: { email: session.user.email },
        data: {
          firstName,
          lastName,
          company,
          telephone,
          address,
          profession,
          education,
          hobby,
          carExist,
          birthday,
          geoLocation: randomGeoHash(),
        },
      })
      if (result.count === 0) {
        return res.status(404).json({ message: 'User not found.' })
      }
      return res.status(RS.SUCCESS_OK).json({
        message: `Information added to ${firstName ?? ''} ${lastName ?? ''}'s profile.`,
      })
    } catch (error) {
      console.error('Could not update PostgreSQL user profile:', error)
      return res.status(500).json({ message: 'Could not update your profile.' })
    }
  }

  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')

  let geoLocation = randomGeoHash()
  const result = await usersCollection.updateOne(
    {
      email: session?.user?.email,
    },
    {
      $set: {
        email: session.user.email,
        firstName: firstName,
        lastName: lastName,
        company: company,
        telephone: telephone,
        address: address,
        profession: profession,
        education: education,
        hobby: hobby,
        geoLocation: geoLocation,
        carExist: carExist,
        day_birth: day_birth,
        month_birth: month_birth,
        year_birth: year_birth,
      },
    },
    { upsert: false }
  )

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message:
      'Information added to ' + firstName + ' ' + lastName + "'s profile.",
  })
}

export default handler
