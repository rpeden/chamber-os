import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { lexicalRoot, p } from '@/endpoints/seed/lexical-helpers'

type EventDoc = {
  id: number | string
  slug?: string | null
}

type OrderDoc = {
  id: number | string
  status?: string | null
  qrToken?: string | null
  stripePaymentIntentId?: string | null
}

const REQUIRED_ENV = ['RUN_STRIPE_LIVE', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const

const BASE_URL = process.env.STRIPE_LIVE_BASE_URL ?? 'http://127.0.0.1:3000'
const TIMEOUT_MS = Number(process.env.STRIPE_LIVE_TIMEOUT_MS ?? 60000)
const POLL_INTERVAL_MS = Number(process.env.STRIPE_LIVE_POLL_INTERVAL_MS ?? 1500)
const QUANTITY = Number(process.env.STRIPE_LIVE_QUANTITY ?? 1)
const PURCHASER_NAME = process.env.STRIPE_LIVE_PURCHASER_NAME ?? 'Stripe Live Test'
const PURCHASER_EMAIL = process.env.STRIPE_LIVE_PURCHASER_EMAIL ?? 'stripe-live-test@example.com'
const TICKET_TYPE = 'Stripe Live Ticket'

function assertEnv(): void {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`)
    }
  }

  if (process.env.RUN_STRIPE_LIVE !== '1') {
    throw new Error('Set RUN_STRIPE_LIVE=1 to run Stripe live tests intentionally')
  }

  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    throw new Error('STRIPE_SECRET_KEY must be a Stripe TEST secret key (sk_test_...)')
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
    throw new Error('STRIPE_WEBHOOK_SECRET must be set to your webhook signing secret (whsec_...)')
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForConfirmedOrder(payload: Awaited<ReturnType<typeof getPayload>>, paymentIntentId: string): Promise<OrderDoc> {
  const deadline = Date.now() + TIMEOUT_MS

  while (Date.now() < deadline) {
    const result = await payload.find({
      collection: 'orders',
      where: {
        stripePaymentIntentId: { equals: paymentIntentId },
      },
      limit: 1,
      depth: 0,
    })

    const order = result.docs[0] as OrderDoc | undefined
    if (order?.status === 'confirmed') {
      return order
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(
    `Timed out waiting for order confirmation for ${paymentIntentId}. Ensure Stripe webhook delivery to ${BASE_URL}/api/webhooks/stripe is configured and healthy.`,
  )
}

describe('Stripe Live: checkout -> webhook confirmation', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>
  let stripe: Stripe
  let createdEvent: EventDoc | null = null
  const createdOrderIds = new Set<string>()

  beforeAll(async () => {
    assertEnv()

    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })

    const now = new Date()
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

    createdEvent = (await payload.create({
      collection: 'events',
      data: {
        title: `Stripe Live Event ${Date.now()}`,
        slug: `stripe-live-event-${Date.now()}`,
        description: lexicalRoot(p('Live Stripe integration fixture event.')),
        location: 'Live Test Hall',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'published',
        isChambersEvent: true,
        ticketingType: 'chamber-managed',
        ticketTypes: [
          {
            name: TICKET_TYPE,
            description: 'Self-managed fixture ticket type',
            price: 2500,
            capacity: 10,
          },
        ],
        serviceFee: {
          feeType: 'none',
          feeAmount: 0,
        },
      },
    })) as EventDoc
  })

  afterAll(async () => {
    if (!payload) return

    for (const orderId of createdOrderIds) {
      try {
        await payload.delete({
          collection: 'orders',
          id: orderId,
        })
      } catch {
        // Best-effort cleanup
      }
    }

    if (createdEvent?.id != null) {
      try {
        await payload.delete({
          collection: 'events',
          id: createdEvent.id,
        })
      } catch {
        // Best-effort cleanup
      }
    }
  })

  it('creates pending order via checkout API and confirms it via Stripe API + webhook', async () => {
    if (!createdEvent?.id) {
      throw new Error('Test fixture event was not created')
    }

    const checkoutResponse = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        eventId: Number(createdEvent.id),
        ticketType: TICKET_TYPE,
        quantity: QUANTITY,
        purchaserName: PURCHASER_NAME,
        purchaserEmail: PURCHASER_EMAIL,
      }),
    })

    const checkoutBody = (await checkoutResponse.json()) as {
      clientSecret?: string
      paymentIntentId?: string
      error?: string
    }

    expect(checkoutResponse.status, checkoutBody.error ?? 'checkout failed').toBe(200)
    expect(checkoutBody.clientSecret).toBeTruthy()
    expect(checkoutBody.paymentIntentId).toBeTruthy()

    const paymentIntentId = checkoutBody.paymentIntentId as string

    const orderLookup = await payload.find({
      collection: 'orders',
      where: {
        stripePaymentIntentId: { equals: paymentIntentId },
      },
      limit: 1,
      depth: 0,
    })

    const pendingOrder = orderLookup.docs[0] as OrderDoc | undefined
    expect(pendingOrder).toBeTruthy()
    expect(pendingOrder?.status).toBe('pending')

    if (pendingOrder?.id != null) {
      createdOrderIds.add(String(pendingOrder.id))
    }

    await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: 'pm_card_visa',
    })

    const confirmedOrder = await waitForConfirmedOrder(payload, paymentIntentId)
    expect(confirmedOrder.status).toBe('confirmed')
    expect(confirmedOrder.qrToken).toBeTruthy()
    expect(confirmedOrder.qrToken?.length).toBe(64)
  })
})
