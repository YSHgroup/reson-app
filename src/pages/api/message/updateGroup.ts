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
  const { groupInfo, people, groupName } = req.body ?? {}
  const groupId = groupInfo?._id
  if (typeof groupId !== 'string' || typeof groupName !== 'string' || !Array.isArray(people)) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid group details.' })
  }
  const memberEmails = Array.from(
    new Set([email, ...people.map((person: { email?: unknown }) => person.email)])
  )
  if (!memberEmails.every((member): member is string => typeof member === 'string' && member.length > 0)) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid group members.' })
  }
  const group = await prisma.chatGroup.findFirst({
    where: { id: groupId, members: { some: { user: { email } } } },
    select: { id: true },
  })
  if (!group) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Group not found.' })
  const users = await prisma.user.findMany({
    where: { email: { in: memberEmails } },
    select: { id: true },
  })
  if (users.length !== memberEmails.length) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'One or more group members do not exist.' })
  }
  await prisma.$transaction([
    prisma.groupMember.deleteMany({ where: { groupId } }),
    prisma.chatGroup.update({
      where: { id: groupId },
      data: {
        title: groupName.trim(),
        members: { create: users.map(({ id }) => ({ userId: id })) },
      },
    }),
  ])
  return res.status(RS.SUCCESS_OK).json({ message: 'Success' })
}
