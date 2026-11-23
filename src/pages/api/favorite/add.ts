import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (process.env.DATABASE_URL) {
    if (req.method !== 'POST') {
      return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Method not supported' })
    }

    try {
      const account = await getPrismaAccount(req, res)
      if (account.status === 'unauthenticated') {
        return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
      }
      if (account.status === 'unmigrated') {
        return res.status(409).json({ message: unmigratedAccountMessage() })
      }
      const body = legacyBody(req.body)
      const projectId = typeof body.id === 'string' ? body.id : ''
      if (!projectId) return res.status(422).json({ message: 'Project id is required.' })

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      })
      if (!project) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Project not found.' })

      await prisma.favorite.upsert({
        where: {
          userId_projectId: { userId: account.user.id, projectId },
        },
        create: { userId: account.user.id, projectId },
        update: {},
      })
      return res.status(RS.SUCCESS_OK).json({ message: 'Added to favorites' })
    } catch (error) {
      console.error('Favorite add failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not add favorite.' })
    }
  }

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
