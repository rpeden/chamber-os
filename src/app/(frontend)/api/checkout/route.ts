import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { createPaymentIntent } from '@/lib/stripe/create-payment-intent'

/**
 * Request body schema for the checkout endpoint.
 * Validated with Zod at the API boundary — untrusted input.
 */
const checkoutSchema = z.object({
  eventId: z.number().int().positive(),
  ticketType: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  purchaserName: z.string().min(1).max(200),
  purchaserEmail: z.string().email().max(200),
})

/**
 * POST /api/checkout
 *
 * Creates a Stripe Payment Intent for event ticket purchases.
 * Supports guest checkout — no authentication required.
 *
 * Returns the Stripe client secret for the frontend to complete
 * payment via Stripe Elements.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    const result = await createPaymentIntent(parsed.data, payload)

    return Response.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      baseAmount: result.baseAmount,
      serviceFeeAmount: result.serviceFeeAmount,
      taxAmount: result.taxAmount,
      taxName: result.taxName,
      totalAmount: result.totalAmount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'

    // Capacity and validation errors get a 400
    if (
      message.includes('not available') ||
      message.includes('not set up') ||
      message.includes('not found') ||
      message.includes('remaining') ||
      message.includes('must be at least') ||
      message.includes('not started') ||
      message.includes('have ended')
    ) {
      return Response.json({ error: message }, { status: 400 })
    }

    // Everything else is a server error
    console.error('[checkout] Unexpected error:', err)
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
