import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { MongoClient, ObjectId } from 'mongodb'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  let error = { message: '' }
  res.setHeader('Content-Type', 'application/json')
  console.log('info session----->', session)
  if (!session) {
    error.message = 'Unauthenticated'
    res.status(RS.CERROR_UNAUTHORIZED).json(error)
  }

  const client = await connectToDatabase()
  const userCollection = client.db().collection('users')
  if (!userCollection)
    res
      .status(RS.SERROR_INTERNAL)
      .json({ message: 'Not connected to database' })
  try {
    const user = userCollection.findOne(
      { email: session.user.email },
      { projection: { day_birth: 1, month_birth: 1, year_birth: 1 } }
    )
    console.log('user info: ', user)
    res.status(RS.SUCCESS_OK).json({ message: user })
  } catch (err) {
    console.log('get user info error-->', err)
    res.status(RS.SERROR_INTERNAL).json(err)
  }
}

export default handler
