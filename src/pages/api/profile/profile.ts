import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import RS from '@constants/ResponseStatus'
import { authOptions } from '../auth/[...nextauth]'
import { connectToDatabase } from '@lib/db'
var randomGeoHash = require('random-geohash')

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }
  const session : any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )

  const {
    firstName,
    lastName,
    company,
    telephone,
    address,
    profession,
    education,
    hobby,
    email,
    carExist,
    day_birth,
    month_birth,
    year_birth,
  } = req.body
  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')
  console.log('req : ', req.body, session?.user?.email)

  let geoLocation = randomGeoHash()
  const result = await usersCollection.updateOne(
    {
      email: session?.user?.email,
    },
    {
      $set: {
        email: email,
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
  console.log('result : ', result.modifiedCount)

  client.close()
  return res.status(RS.SUCCESS_OK).json({
    message:
      'Information added to ' + firstName + ' ' + lastName + "'s profile.",
  })
}

export default handler
