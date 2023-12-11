import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { MongoClient, ObjectId } from 'mongodb'

const findUserFavoriteIds = async (
  client: any,
  collectionName: string,
  emailAdress: string
) => {
  const favoritesCollection = client.db().collection(collectionName)
  try {
    const favorites = await favoritesCollection.findOne({
      user_email: emailAdress,
    })
    return favorites
  } catch (error) {
    console.error('Error finding documents', error)
    throw error
  }
}

const findUserFavorite = async (
  client: MongoClient,
  collectionName: string,
  ids: string[]
) => {
  console.log('favorite id: ', ids)
  const projectCollection = client.db().collection(collectionName)
  try {
    const favorites = await projectCollection
      .find({
        _id: {
          $in: ids.map(id => new ObjectId(id))
        },
      })
      .toArray()
    console.log('is favorites? ', favorites.length)
    return favorites
  } catch (error) {
    throw error
  } finally {
    client.close()
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  res.setHeader('Content-Type', 'application/json')
  if (!session)
    return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'GET')
    return res
      .status(RS.CERROR_FORBIDDEN)
      .json({ message: 'Method not supported' })
  try {
    let error = new Error()

    const client = await connectToDatabase()

    // Get the user's favorite ids from mongodb by email address
    const ids = (
      await findUserFavoriteIds(client, 'favorites', session.user.email)
    ).favor_id
    if (ids.length === 0) {
      error.message = 'No Favorites'
      console.error('id error-->', error)
      return res.status(RS.CERROR_NOTFOUND).json({ error })
    }
    console.log('favor ids-->', ids)

    // Get the user's favorite list from mongodb by favorite ids
    const favorites  = await findUserFavorite(client, 'needs', ids)
    console.table(favorites.map(favor => favor._id))
    if (ids.length === 0) {
      error.message = 'DataBase error!'
      return res.status(RS.SERROR_INTERNAL).json({ error })
    }

    res.status(RS.SUCCESS_OK).json({ favorites })
  } catch (err) {
    console.log('get-favorites response error: ', err)
    return res
      .status(RS.SERROR_INTERNAL)
      .json({ message: "Favorite datas no exist or Internal server error" })
  }
}

export default handler
