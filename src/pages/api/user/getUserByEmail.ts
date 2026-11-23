import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  let body: unknown = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(422).json({ message: 'A valid email is required.' })
    }
  }
  const parsed = z.object({ email: z.string().email() }).safeParse(body)
  if (!parsed.success) return res.status(422).json({ message: 'A valid email is required.' })

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: {
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
