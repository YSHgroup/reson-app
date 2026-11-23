import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { authOptions } from '../auth/[...nextauth]'
import { getServerSession } from 'next-auth/next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (!user) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    orderBy: { displayName: 'asc' },
  })
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
    data: contacts.map((contact) => ({
      _id: contact.id,
      author: email,
      name: contact.displayName,
      emailAddress: contact.email,
      photo: contact.photoUrl,
      birthday: contact.birthday,
      phoneNumber: contact.phoneNumber,
    })),
  })
}
