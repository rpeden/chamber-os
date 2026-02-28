import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { createFreeRegistration } from '@/lib/orders/create-free-registration'

const registerSchema = z.object({
  eventId: z.number().int().positive(),
  ticketType: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  purchaserName: z.string().min(1).max(200),
  purchaserEmail: z.string().email().max(200),
})

/**
 * POST /api/register
 *
 * Handles free event registrations (free-registration event type,
 * or chamber-managed events with price=0 tickets).
 *
 * No payment required — order is created directly as confirmed.
 * Returns the QR token which the frontend uses to navigate to
 * the confirmation page.
 *
 * Supports guest registration — no authentication required.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    const result = await createFreeRegistration(parsed.data, payload)

    return Response.json({
      orderId: result.orderId,
      qrToken: result.qrToken,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'

    if (
      message.includes('not available') ||
      message.includes('not set up') ||
      message.includes('not found') ||
      message.includes('remaining') ||
      message.includes('must be at least') ||
      message.includes('not a free ticket')
    ) {
      return Response.json({ error: message }, { status: 400 })
    }

    console.error('[register] Unexpected error:', err)
    return Response.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
