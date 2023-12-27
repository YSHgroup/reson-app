import {NextApiRequest , NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const saveResutls = async (email: string, results: any) => {
    let date = new Date()
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    const data = { results, searchedDate: `${year} / ${month} / ${day}` }
    const client = await connectToDatabase()
    // console.log('request saving function: ', email)
    const searchHistoryCollection = client.db().collection('search_history')
    try {
      const response = await searchHistoryCollection.updateOne(
        { email: email },
        { $push: { data } },
        { upsert: true }
      )
      // console.log('save the search history: ', response)
    } catch (error) {
      console.log('save the search history error: ', error)
    }
  }

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method !== 'PUT') return res.status(RS.CERROR_FORBIDDEN).json('Wrong HTTP method')
    const session : any = await getServerSession(req as any, res as any, authOptions as any)
    if(session === undefined) return res.status(RS.CERROR_UNAUTHORIZED).json('Unauthorized')
    const {list}  = req.body
    console.log('history put data: ', session, list)
    saveResutls(session.user.email, list)
}

export default handler