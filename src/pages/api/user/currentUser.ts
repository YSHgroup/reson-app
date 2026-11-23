import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email) return res.status(401).json({ message: 'Unauthorized.' })

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      nickname: true,
      firstName: true,
      lastName: true,
      company: true,
      telephone: true,
      address: true,
      profession: true,
      education: true,
      hobby: true,
      carExist: true,
      birthday: true,
      sex: true,
      picturePath: true,
      bio: true,
      settings: { select: { status: true } },
    },
  })
  if (!user) return res.status(404).json({ message: 'User not found.' })

  const birthday = user.birthday
  return res.json({
    status: 200,
    data: {
      ...user,
      picpath: user.picturePath,
      day_birth: birthday?.getDate(),
      month_birth: birthday ? birthday.getMonth() + 1 : undefined,
      year_birth: birthday?.getFullYear(),
      status: user.settings?.status ?? 0,
    },
  })
}
