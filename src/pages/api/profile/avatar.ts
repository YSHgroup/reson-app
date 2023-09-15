import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
var randomGeoHash = require('random-geohash')

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return
  }

  const session = await getSession({
    req,
  })
  
  
  const { picpath } = req.body
  const client = await connectToDatabase()

  const usersCollection = client.db().collection('users')

  let geoLocation = randomGeoHash()

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
