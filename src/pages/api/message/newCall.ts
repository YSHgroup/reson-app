import type { NextApiRequest, NextApiResponse } from 'next'
import RS from '@constants/ResponseStatus'
import { prisma } from '@lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { formatTime, timestampToFormattedDate } from '@lib/utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(RS.CERROR_UNAUTHORIZED).json({ message: 'Unauthorized' })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Wrong HTTP Method' })
  }
  const recipientEmail = req.body?.to
  if (typeof recipientEmail !== 'string' || !recipientEmail) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'Invalid recipient.' })
  }
  const now = Date.now()
  const call = await prisma.directMessage.create({
    data: {
      author: { connect: { email } },
      recipient: { connect: { email: recipientEmail } },
      type: 'voiceCall',
      content: '0',
      metadata: {
        date: timestampToFormattedDate(now),
        time: formatTime(now),
      },
    },
    select: { id: true },
  })
  return res.status(RS.SUCCESS_OK).json({
    message: 'Success',
    newCallInfo: { insertedId: call.id },
  })
}
