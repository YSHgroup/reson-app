import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Wrong HTTP Method' })
  }

  const { people, groupName } = req.body ?? {}
  if (typeof groupName !== 'string' || !groupName.trim() || !Array.isArray(people)) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid group details.' })
  }
  const memberEmails = Array.from(
    new Set([email, ...people.map((person: { email?: unknown }) => person.email)])
  )
  if (!memberEmails.every((member): member is string => typeof member === 'string' && member.length > 0)) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid group members.' })
  }
  const users = await prisma.user.findMany({
    where: { email: { in: memberEmails } },
    select: { id: true },
  })
  if (users.length !== memberEmails.length) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'One or more group members do not exist.' })
  }
  await prisma.chatGroup.create({
    data: {
      title: groupName.trim(),
      owner: { connect: { email } },
      members: { create: users.map(({ id }) => ({ userId: id })) },
    },
  })
  return res.status(RS.SUCCESS_OK).json({ message: 'Success' })
}
