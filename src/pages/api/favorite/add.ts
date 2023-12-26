import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  res.setHeader('Content-Type', 'application/json')
  if (!session)
    return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST')
    return res
      .status(RS.CERROR_FORBIDDEN)
      .json({ message: 'Method not supported' })
  const { id } = req.body
  try {
    const client = await connectToDatabase()
    const favoritesCollection = client.db().collection('favorites')

    if (await favoritesCollection.findOne({ user_email: session.user.email })) {
      const addNewFavorite = await favoritesCollection.updateOne(
        { user_email: session.user.email },
        { $push: { favor_id: id } },
        {upsert:true} // This makes it unnececcessary to calls to it block in this function
      )
      // console.log('save-favorites find:', addNewFavorite)
      const success = {message: ''}
      success.message = 'Added to favorites'
      res.status(RS.SUCCESS_OK).json(success)
    } else {
      const addNewFavorite = await favoritesCollection.insertOne({
        user_email: session.user.email,
        favor_id: [id],
      })
      // console.log('save-favorites insert:', addNewFavorite)
      const success = {message: ''}
      success.message = 'Added to favorites'
      res.status(RS.SUCCESS_OK).json(success)
    }
  } catch (err) {
    console.log('error', err)
    err.message = 'Internal Server Error'
    res.status(RS.SERROR_INTERNAL).json(err)
  }
}

export default handler
