import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const email = req.body?.email
  if (typeof email !== 'string') return res.status(422).json({ message: 'A valid email is required.' })
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { picturePath: true },
  })
  return res.json({
    status: 200,
    data: user ? [{ picpath: user.picturePath }] : [],
  })
}
