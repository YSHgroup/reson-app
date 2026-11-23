import { randomBytes } from 'node:crypto'
import { MINIMAL_PASSWORD_LENGTH } from '@constants/UserSignup'
import RS from '@constants/ResponseStatus'
import { hashPassword } from '@lib/auth'
import { prisma } from '@lib/prisma'
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

  const input = parsed.data
  const email = input.email.toLowerCase()
  const verificationRequired = isEmailConfigured()
  const verificationCode = verificationRequired
    ? randomBytes(24).toString('hex')
    : null
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(input.password),
        nickname: input.nickname,
        role: input.role ?? UserRole.user,
        enabled: !verificationRequired,
        verificationCode,
        verificationSentAt: verificationRequired ? new Date() : null,
        birthday: parsedBirthday(input.birthday),
        sex: input.sex || null,
        settings: { create: { language: input.lang ?? 0 } },
      },
      select: { id: true },
    })

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
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return res.status(RS.CERROR_UNPROCESSABLE).json({ message: 'User exists already!' })
    }
    console.error('PostgreSQL account registration failed:', error)
    return res.status(500).json({ message: 'Could not create your account.' })
  }
}
