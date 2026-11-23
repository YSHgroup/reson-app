import { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { getDistance } from 'geolib'
import { z } from 'zod'
import { prisma } from '@lib/prisma'
import { getPrismaAccount, legacyBody } from '@lib/project-api'
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

const filterByRadius = (origin: any, dataArray: any[], radius: number) => {
  return dataArray.filter((data) =>
    data.location != undefined
      ? getDistance(origin, data.location) <= radius * 1000
      : false
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(RS.CERROR_FORBIDDEN).json({ message: 'Wrong HTTP Method' })
  }

  try {
    const account = await getPrismaAccount(req, res)
    if (account.status === 'unauthenticated') {
      return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
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
    return res.status(RS.SERROR_INTERNAL).json({
      message: 'Could not search projects.',
    })
  }
}

export default handler
