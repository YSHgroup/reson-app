import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { connectToDatabase } from '@lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { MongoClient } from 'mongodb'
import { getDistance } from 'geolib'
import { haversineFun } from 'functions/calcDIstance'
import { z } from 'zod'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody, unmigratedAccountMessage } from '@lib/project-api'
import { toLegacyProject } from '@lib/project-compat'

const searchSchema = z.object({
  title: z.string().trim().min(1).max(200),
  min: z.coerce.number().finite(),
  max: z.coerce.number().finite(),
  radius: z.coerce.number().finite().min(0).optional(),
  origin: z
    .object({
      latitude: z.coerce.number().finite().min(-90).max(90),
      longitude: z.coerce.number().finite().min(-180).max(180),
    })
    .optional(),
  where: z.string().max(160).nullable().optional(),
  role: z.string().max(80).optional(),
  payUnit: z.string().max(40).optional(),
})

// const saveResutls = async (email: string, results: any) => {
//   let date = new Date()
//   let year = date.getFullYear()
//   let month = date.getMonth() + 1
//   let day = date.getDate()
//   const data = { results, searchedDate: `${year} / ${month} / ${day}` }
//   const client = await connectToDatabase()
//   // console.log('request saving function: ', email)
//   const searchHistoryCollection = client.db().collection('search_history')
//   try {
//     const response = await searchHistoryCollection.updateOne(
//       { email: email },
//       { $push: { data } },
//       { upsert: true }
//     )
//     // console.log('save the search history: ', response)
//   } catch (error) {
//     console.log('save the search history error: ', error)
//   }
// }

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
  if (process.env.DATABASE_URL) {
    if (req.method !== 'POST') {
      return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
    }

    try {
      const account = await getPrismaAccount(req, res)
      if (account.status === 'unauthenticated') {
        return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
      }
      if (account.status === 'unmigrated') {
        return res.status(409).json({ message: unmigratedAccountMessage() })
      }

      const parsed = searchSchema.safeParse(legacyBody(req.body))
      if (
        !parsed.success ||
        parsed.data.min >= parsed.data.max ||
        (parsed.data.radius && !parsed.data.origin)
      ) {
        return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid project search filters.' })
      }

      const search = parsed.data
      const titleTerms = search.title.split(/\s+/).filter(Boolean)
      const projects = await prisma.project.findMany({
        where: {
          status: 'OPEN',
          authorId: { not: account.user.id },
          price: { gt: search.min, lt: search.max },
          OR: titleTerms.map((term) => ({
            title: { contains: term, mode: 'insensitive' },
          })),
          ...(search.where
            ? {
                location: {
                  contains: search.where,
                  mode: 'insensitive' as const,
                },
              }
            : {}),
          ...(search.role && search.role !== 'all'
            ? { workMode: search.role }
            : {}),
          ...(search.payUnit && search.payUnit !== 'all'
            ? { payUnit: search.payUnit }
            : {}),
        },
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      })

      const results = projects.map((project) => toLegacyProject(project))
      const filtered =
        search.radius && search.origin
          ? filterByRadius(search.origin, results, search.radius)
          : results
      return res.status(RS.SUCCESS_OK).json({
        message: 'Success',
        results: filtered,
      })
    } catch (error) {
      console.error('Project search failed:', error)
      return res.status(RS.SERROR_INTERNAL).json({ message: 'Could not search projects.' })
    }
  }

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
  // console.log('search contents: ', origin, radius)
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
    // console.log('calculations--->', filterByRadius(origin, results, radius))
    if (!radius) {
      return res.status(200).json({
        message: 'Success',
        results: results,
      })
    }
    //Save the results searched by user
    // saveResutls(session.user.email, results)
    let filterdData = filterByRadius(origin, results, radius)
    // console.log('filterd--->', filterdData)
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
