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
  const callId = req.body?.callId
  if (typeof callId !== 'string') {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid call.' })
  }
  const result = await prisma.directMessage.updateMany({
    where: { id: callId, recipient: { email } },
    data: { content: '2', read: true },
  })
  if (!result.count) return res.status(RS.CERROR_NOTFOUND).json({ message: 'Call not found.' })
  return res.status(RS.SUCCESS_OK).json({ message: 'Success', newCallInfo: result })
}
