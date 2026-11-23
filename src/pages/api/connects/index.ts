import { getServerSession } from 'next-auth/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'
import { getStripeClient } from '@lib/stripe'

const checkoutSchema = z.object({ action: z.literal('checkout') })

function packConfiguration() {
  const priceCents = Number(process.env.CONNECT_PACK_PRICE_CENTS ?? 1000)
  const connects = Number(process.env.CONNECT_PACK_SIZE ?? 100)

  if (
    !Number.isSafeInteger(priceCents) ||
    priceCents <= 0 ||
    !Number.isSafeInteger(connects) ||
    connects <= 0
  ) {
    throw new Error('Connect pack price and size must be positive integers.')
  }

  return { priceCents, connects }
}

function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL
  if (!value) throw new Error('NEXT_PUBLIC_SITE_URL is required for checkout.')

  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.')
  }
  return url.origin
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email?.trim().toLowerCase()
    if (!email) return res.status(401).json({ message: 'Sign in to continue.' })

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, connects: true },
    })
    if (!user) {
      return res.status(409).json({
        message: 'Your account has not been imported into the new profile service yet.',
      })
    }

    const pack = packConfiguration()
    if (req.method === 'GET') {
      return res.status(200).json({ ...pack, balance: user.connects })
    }

    const parsed = checkoutSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ message: 'Invalid checkout request.' })
    }

    const purchase = await prisma.connectPurchase.create({
      data: {
        userId: user.id,
        connects: pack.connects,
        amountCents: pack.priceCents,
      },
    })

    let checkout
    try {
      const baseUrl = siteUrl()
      checkout = await getStripeClient().checkout.sessions.create(
        {
          mode: 'payment',
          allowed_payment_method_types: ['card'],
          customer_email: email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'usd',
                unit_amount: pack.priceCents,
                product_data: {
                  name: `${pack.connects} ResonApp Connects`,
                  description: 'Credits for applying to ResonApp projects.',
                },
              },
            },
          ],
          metadata: {
            connectPurchaseId: purchase.id,
            userId: user.id,
            connects: String(pack.connects),
          },
          success_url: `${baseUrl}/connects?success=1`,
          cancel_url: `${baseUrl}/connects?cancelled=1`,
        },
        { idempotencyKey: purchase.id }
      )
    } catch (error) {
      await prisma.connectPurchase.update({
        where: { id: purchase.id },
        data: { status: 'failed' },
      })
      console.error(
        'Stripe checkout session creation failed:',
        error instanceof Error ? error.message : 'Unknown Stripe error.'
      )
      return res.status(502).json({
        message: 'Could not start checkout. Please try again later.',
      })
    }

    await prisma.connectPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkout.id },
    })

    if (!checkout.url) {
      throw new Error('Stripe returned a checkout session without a URL.')
    }

    return res.status(201).json({ checkoutUrl: checkout.url })
  } catch (error) {
    console.error('Connect purchase request failed:', error)
    return res.status(500).json({ message: 'Could not load Connects.' })
  }
}
