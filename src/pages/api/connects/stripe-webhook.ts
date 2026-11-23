import type { NextApiRequest, NextApiResponse } from 'next'
import type Stripe from 'stripe'
import { prisma } from '@lib/prisma'
import { getStripeClient } from '@lib/stripe'

export const config = {
  api: { bodyParser: false },
}

const MAX_BODY_BYTES = 1_000_000

async function readRawBody(req: NextApiRequest) {
  const chunks: Buffer[] = []
  let length = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    length += buffer.length
    if (length > MAX_BODY_BYTES) {
      throw new RangeError('Stripe webhook payload is too large.')
    }
    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const purchaseId = session.metadata?.connectPurchaseId
  const userId = session.metadata?.userId
  const connects = Number(session.metadata?.connects)

  if (
    session.payment_status !== 'paid' ||
    !purchaseId ||
    !userId ||
    !Number.isSafeInteger(connects) ||
    connects <= 0
  ) {
    return
  }

  await prisma.$transaction(async (transaction) => {
    const purchase = await transaction.connectPurchase.findUnique({
      where: { id: purchaseId },
    })

    if (
      !purchase ||
      purchase.userId !== userId ||
      purchase.connects !== connects ||
      purchase.amountCents !== session.amount_total ||
      session.currency !== 'usd' ||
      (purchase.stripeSessionId &&
        purchase.stripeSessionId !== session.id) ||
      purchase.status !== 'pending'
    ) {
      return
    }

    const claimed = await transaction.connectPurchase.updateMany({
      where: {
        id: purchase.id,
        status: 'pending',
        OR: [
          { stripeSessionId: null },
          { stripeSessionId: session.id },
        ],
      },
      data: {
        status: 'completed',
        stripeSessionId: session.id,
        completedAt: new Date(),
      },
    })
    if (claimed.count === 0) return

    await transaction.user.update({
      where: { id: purchase.userId },
      data: { connects: { increment: purchase.connects } },
    })
  })
}

async function failExpiredCheckout(session: Stripe.Checkout.Session) {
  const purchaseId = session.metadata?.connectPurchaseId
  if (!purchaseId) return

  await prisma.connectPurchase.updateMany({
    where: {
      id: purchaseId,
      status: 'pending',
      stripeSessionId: session.id,
    },
    data: { status: 'failed' },
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const signature = req.headers['stripe-signature']
  if (typeof signature !== 'string') {
    return res.status(400).json({ message: 'Missing Stripe signature.' })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured.')
    return res.status(500).json({ message: 'Webhook is not configured.' })
  }

  let event: Stripe.Event
  try {
    const rawBody = await readRawBody(req)
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    )
  } catch (error) {
    if (error instanceof RangeError) {
      return res.status(413).json({ message: 'Webhook payload is too large.' })
    }
    console.error(
      'Stripe webhook processing failed:',
      error instanceof Error ? error.message : 'Unknown webhook error.'
    )
    return res.status(400).json({ message: 'Could not verify or process webhook.' })
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await fulfillCheckout(event.data.object)
    } else if (event.type === 'checkout.session.expired') {
      await failExpiredCheckout(event.data.object)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error(
      'Stripe webhook database update failed:',
      error instanceof Error ? error.message : 'Unknown webhook error.'
    )
    return res.status(500).json({ message: 'Webhook processing failed.' })
  }
}
