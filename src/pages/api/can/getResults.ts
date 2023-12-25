import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { MongoClient } from 'mongodb'
import { getDistance } from 'geolib'
import { haversineFun } from 'functions/calcDIstance'

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

const filterByRadius = (origin: any, dataArray: any[], radius: number) => {
  
  // let dataMap = dataArray.map(data => data.location != undefined? haversineFun(origin, data.location): null)
  // console.log('data map: ', dataMap)
  let filterdData = dataArray.filter((data) =>
    data.location != undefined
      ? getDistance(origin, data.location) <= radius * 1000
      : false
  )
  // let filterdData = dataArray.filter(
  //   (data) => haversineFun(origin, data.location) <= radius * 1000
  // )
  return filterdData
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(
    req as any,
    res as any,
    authOptions as any
  )
  if (session == undefined)
    return res.status(RS.CERROR_UNAUTHORIZED).json({
      message: 'Unauthorized',
    })

  if (req.method !== 'POST') {
    return res.status(RS.CERROR_FORBIDDEN).json({
      message: 'Wrong HTTP Method',
    })
  }
  const data = JSON.parse(req.body)
  const { origin, radius } = data
  console.log('search contents: ', origin, radius)
  const client = await connectToDatabase()
  const needsCollection = client.db().collection('needs')
  const titleKeywords = data.title.split(' ')
  const titleQuery = titleKeywords.map((e: string) => {
    return new RegExp(e, 'i')
  })
  let query: any = [
    { exist: 1 },
    { price: { $gt: data.min * 1, $lt: data.max * 1 } },
    { author: { $ne: session?.user?.email } },
  ]
  if (data.where) {
    query.push({ where: { $regex: data.where, $options: 'i' } })
  }
  if (data.role) {
    data.role !== 'all' && query.push({ role: data.role })
  }
  if (data.payUnit) {
    data.payUnit !== 'all' && query.push({ payUnit: data.payUnit })
  }
  try {
    const results = await needsCollection
      .find({
        $and: query,
        title: { $in: titleQuery },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // console.log('projects--->', results)
    console.log('calculations--->', filterByRadius(origin, results, radius))
    if (!radius) {
      return res.status(200).json({
        message: 'Success',
        results: results,
      })
    }
    //Save the results searched by user
    saveResutls(session.user.email, results)
    let filterdData = filterByRadius(origin, results, radius)
    console.log('filterd--->', filterdData)
    client.close()
    return res.status(200).json({
      message: 'Success',
      results: filterdData,
    })
  } catch (error) {
    client.close()
    return res.status(RS.SERROR_INTERNAL).json({
      message: error,
    })
  }
}

export default handler
