import { randomBytes } from 'node:crypto'
import { MINIMAL_PASSWORD_LENGTH } from '@constants/UserSignup'
import RS from '@constants/ResponseStatus'
import { hashPassword } from '@lib/auth'
import { connectToDatabase } from '@lib/db'
import { isEmailConfigured } from '@lib/sendEmail'
import sendEmail from '@lib/sendEmail'
import { UserRole } from '../../../generated/prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(MINIMAL_PASSWORD_LENGTH).max(128),
  nickname: z.string().trim().min(1).max(80),
  birthday: z.string().optional().nullable(),
  sex: z.string().max(40).optional().nullable(),
  lang: z.coerce.number().int().min(0).max(3).optional(),
  role: z.enum(['user', 'client', 'talent']).optional(),
})

function parsedBirthday(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function publicBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL
  if (!baseUrl) throw new Error('NEXTAUTH_URL is required for verification links.')
  return new URL(baseUrl).origin
}

async function createPostgresAccount(
  input: z.infer<typeof signupSchema>,
  res: NextApiResponse
) {
  const { prisma } = await import('@lib/prisma')
  const email = input.email.toLowerCase()
  const verificationRequired = isEmailConfigured()
  const verificationCode = verificationRequired
    ? randomBytes(24).toString('hex')
    : null
  const password = await hashPassword(input.password)

  let user
  try {
    user = await prisma.user.create({
      data: {
        email,
        password,
        nickname: input.nickname,
        role: input.role ?? UserRole.user,
        enabled: !verificationRequired,
        verificationCode,
        verificationSentAt: verificationRequired ? new Date() : null,
        birthday: parsedBirthday(input.birthday),
        sex: input.sex || null,
        settings: {
          create: {
            language: input.lang ?? 0,
          },
        },
      },
      select: { id: true },
    })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return res.status(RS.CERROR_UNPROCESSABLE).json({
        message: 'User exists already!',
      })
    }
    throw error
  }

  if (verificationCode) {
    try {
      await sendEmail(
        email,
        'Verify your ResonApp account',
        `${publicBaseUrl()}/api/auth/verify/${user.id}/${verificationCode}`
      )
    } catch (error) {
      console.error('Signup verification email failed:', error)
      try {
        await prisma.user.delete({ where: { id: user.id } })
      } catch (cleanupError) {
        console.error('Could not roll back unverified signup:', cleanupError)
      }
      return res.status(503).json({
        message: 'Could not send verification email. Check SMTP settings and try again.',
      })
    }
  }

  return res.status(RS.SUCCESS_CREATED).json({
    message: verificationRequired
      ? 'Account created. Check your email to verify it.'
      : 'Account created. You can now sign in.',
  })
}

async function createMongoAccount(
  input: z.infer<typeof signupSchema>,
  res: NextApiResponse
) {
  const email = input.email.toLowerCase()
  const client = await connectToDatabase()

  try {
    const db = client.db()
    const users = db.collection('users')
    if (await users.findOne({ email })) {
      return res.status(RS.CERROR_UNPROCESSABLE).json({
        message: 'User exists already!',
      })
    }

    const verificationRequired = isEmailConfigured()
    const verificationCode = verificationRequired
      ? randomBytes(24).toString('hex')
      : null
    const now = new Date()
    const birthday = parsedBirthday(input.birthday)
    const password = await hashPassword(input.password)
    const user = await users.insertOne({
      email,
      password,
      day_birth: birthday?.getDate(),
      month_birth: birthday ? birthday.getMonth() + 1 : undefined,
      year_birth: birthday?.getFullYear(),
      nickname: input.nickname,
      sex: input.sex || 'male',
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hour: now.getHours(),
      min: now.getMinutes(),
      sec: now.getSeconds(),
      enable: !verificationRequired,
      verify_code: verificationCode,
      code_send_time: verificationRequired ? now.getTime() : null,
      status: 0,
      role: input.role ?? 'user',
    })

    await db.collection('settings').insertOne({
      user_id: user.insertedId,
      language: input.lang ?? 0,
      modus: 0,
      status: 0,
      show_firstname: 0,
      show_lastname: 0,
      show_email: 0,
      show_telephone: 0,
      show_analyse: 0,
      show_position: 0,
    })

    if (verificationCode) {
      await sendEmail(
        email,
        'Verify your ResonApp account',
        `${publicBaseUrl()}/api/auth/verify/${user.insertedId}/${verificationCode}`
      )
    }

    return res.status(RS.SUCCESS_CREATED).json({
      message: verificationRequired
        ? 'Account created. Check your email to verify it.'
        : 'Account created. You can now sign in.',
    })
  } catch (error) {
    console.error('MongoDB account registration failed:', error)
    return res.status(500).json({ message: 'Could not create your account.' })
  } finally {
    await client.close()
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(RS.CERROR_UNPROCESSABLE).json({
      message: `Invalid signup details. Password must be at least ${MINIMAL_PASSWORD_LENGTH} characters.`,
    })
  }

  try {
    if (process.env.DATABASE_URL) {
      return await createPostgresAccount(parsed.data, res)
    }
    return await createMongoAccount(parsed.data, res)
  } catch (error) {
    console.error('Account registration failed:', error)
    return res.status(500).json({ message: 'Could not create your account.' })
  }
}
