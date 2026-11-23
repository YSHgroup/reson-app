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
  const groupId = req.body?.groupInfo?._id
  if (typeof groupId !== 'string') {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid group.' })
  }
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, user: { email } },
    select: { id: true },
  })
  if (!membership) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Group not found.' })
  await prisma.groupMember.delete({ where: { id: membership.id } })
  return res.status(RS.SUCCESS_OK).json({ message: 'Success' })
}
