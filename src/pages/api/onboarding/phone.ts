import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { getServerSession } from 'next-auth/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'

const requestSchema = z.object({
  action: z.literal('request'),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
})

const verifySchema = z.object({
  action: z.literal('verify'),
  code: z.string().regex(/^\d{6}$/),
})

function hashCode(userId: string, code: string, secret: string) {
  return createHmac('sha256', secret).update(`${userId}:${code}`).digest()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email?.trim().toLowerCase()
    if (!email) {
      return res.status(401).json({ message: 'Sign in to verify your phone.' })
    }

    const account = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        telephone: true,
        phoneVerified: true,
        phoneOtpHash: true,
        phoneOtpExpiresAt: true,
        phoneOtpSentAt: true,
        phoneOtpAttempts: true,
      },
    })

    if (!account) {
      return res.status(409).json({
        message: 'Your account has not been imported into the new profile service yet.',
      })
    }

    const body = req.body
    const action =
      typeof body === 'object' && body !== null && 'action' in body
        ? body.action
        : undefined
    if (action === 'request') {
      const parsed = requestSchema.safeParse(body)
      if (!parsed.success) {
        return res.status(422).json({
          message: 'Enter a valid phone number in international format.',
        })
      }

      if (account.phoneVerified && account.telephone === parsed.data.phone) {
        return res.status(200).json({ phoneVerified: true })
      }

      const sentAt = account.phoneOtpSentAt?.getTime() ?? 0
      if (Date.now() - sentAt < 60_000) {
        return res.status(429).json({
          message: 'Wait one minute before requesting another code.',
        })
      }

      const {
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_FROM_NUMBER,
        NEXTAUTH_SECRET,
      } = process.env
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        return res.status(503).json({
          message: 'Phone verification is not configured on this server.',
        })
      }
      if (!NEXTAUTH_SECRET) {
        throw new Error('NEXTAUTH_SECRET is required to protect phone codes.')
      }

      const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
      const expiresAt = new Date(Date.now() + 5 * 60_000)
      const codeHash = hashCode(account.id, code, NEXTAUTH_SECRET).toString('hex')
      const cooldownCutoff = new Date(Date.now() - 60_000)
      const reservation = await prisma.user.updateMany({
        where: {
          id: account.id,
          OR: [
            { phoneOtpSentAt: null },
            { phoneOtpSentAt: { lt: cooldownCutoff } },
          ],
        },
        data: {
          telephone: parsed.data.phone,
          phoneVerified: false,
          phoneOtpHash: codeHash,
          phoneOtpExpiresAt: expiresAt,
          phoneOtpSentAt: new Date(),
          phoneOtpAttempts: 0,
        },
      })

      if (reservation.count === 0) {
        return res.status(429).json({
          message: 'Wait one minute before requesting another code.',
        })
      }

      const credentials = Buffer.from(
        `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
      ).toString('base64')
      const message = new URLSearchParams({
        To: parsed.data.phone,
        From: TWILIO_FROM_NUMBER,
        Body: `Your ResonApp verification code is ${code}. It expires in 5 minutes.`,
      })
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: message,
        }
      )

      if (!response.ok) {
        console.error('Phone verification provider rejected an SMS request:', response.status)
        await prisma.user.updateMany({
          where: { id: account.id, phoneOtpHash: codeHash },
          data: { phoneOtpHash: null, phoneOtpExpiresAt: new Date() },
        })
        return res.status(502).json({
          message: 'Could not send a verification code. Try again later.',
        })
      }

      return res.status(200).json({ message: 'Verification code sent.' })
    }

    const parsed = verifySchema.safeParse(body)
    if (!parsed.success) {
      return res.status(422).json({ message: 'Enter the six-digit code.' })
    }

    if (
      !account.phoneOtpHash ||
      !account.phoneOtpExpiresAt ||
      account.phoneOtpExpiresAt.getTime() <= Date.now() ||
      account.phoneOtpAttempts >= 5
    ) {
      return res.status(400).json({
        message: 'This verification code has expired. Request a new one.',
      })
    }

    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is required to protect phone codes.')
    }

    const expected = Buffer.from(account.phoneOtpHash, 'hex')
    const received = hashCode(account.id, parsed.data.code, process.env.NEXTAUTH_SECRET)
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      const attempt = await prisma.user.updateMany({
        where: {
          id: account.id,
          phoneOtpHash: account.phoneOtpHash,
          phoneOtpExpiresAt: { gt: new Date() },
          phoneOtpAttempts: { lt: 5 },
        },
        data: {
          phoneOtpAttempts: { increment: 1 },
        },
      })
      if (attempt.count === 0) {
        return res.status(400).json({
          message: 'This verification code has expired. Request a new one.',
        })
      }
      return res.status(400).json({ message: 'The verification code is incorrect.' })
    }

    const verification = await prisma.user.updateMany({
      where: {
        id: account.id,
        phoneOtpHash: account.phoneOtpHash,
        phoneOtpExpiresAt: { gt: new Date() },
        phoneOtpAttempts: { lt: 5 },
      },
      data: {
        phoneVerified: true,
        phoneOtpHash: null,
        phoneOtpExpiresAt: null,
        phoneOtpAttempts: 0,
      },
    })

    if (verification.count === 0) {
      return res.status(400).json({
        message: 'This verification code has expired. Request a new one.',
      })
    }

    return res.status(200).json({ phoneVerified: true })
  } catch (error) {
    console.error('Phone verification request failed:', error)
    return res.status(500).json({ message: 'Could not verify your phone.' })
  }
}
