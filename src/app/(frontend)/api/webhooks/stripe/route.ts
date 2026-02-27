import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe/client'
import { OrderService } from '@/lib/orders/order-service'
import { env } from '@/lib/env'
import type Stripe from 'stripe'

/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook endpoint for payment event processing.
 *
 * This handler is deliberately thin — it verifies the webhook
 * signature, extracts the Payment Intent ID, and delegates to
 * OrderService which handles the actual state transitions,
 * QR token generation, and audit logging (ADR-6).
 *
 * Idempotency is built into OrderService.confirmFromWebhook() —
 * Stripe may retry webhooks and this handler will not create
 * duplicate orders or fail on re-delivery.
 */
export async function POST(req: Request): Promise<Response> {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Read the raw body for signature verification
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe-webhook] Signature verification failed:', message)
    return new Response(`Webhook signature verification failed`, { status: 400 })
  }

  // We only care about successful payments
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    try {
      const payload = await getPayload({ config })
      const orderService = new OrderService(payload)
      await orderService.confirmFromWebhook(paymentIntent.id)

      console.info(`[stripe-webhook] Order confirmed for PI: ${paymentIntent.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[stripe-webhook] Failed to confirm order for PI ${paymentIntent.id}:`, message)
      // Return 500 so Stripe retries
      return new Response('Order confirmation failed', { status: 500 })
    }
  }

  // Acknowledge receipt — Stripe expects a 200 for all handled events
  return new Response('ok', { status: 200 })
}
