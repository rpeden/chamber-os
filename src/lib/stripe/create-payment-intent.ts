import type { Payload } from 'payload'
import { getStripe } from './client'
import { calculateServiceFee } from '../orders/fee-calculator'

/**
 * Input for creating a payment intent for chamber-managed event tickets.
 */
export interface CreatePaymentIntentInput {
  eventId: number
  ticketType: string
  quantity: number
  purchaserName: string
  purchaserEmail: string
  contactId?: number
}

/**
 * Result returned to the checkout API route (and ultimately the frontend).
 */
export interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  /** Base ticket cost in minor units (price × quantity, before fee) */
  baseAmount: number
  /** Service fee in minor units */
  serviceFeeAmount: number
  /** Total charged in minor units (base + fee) */
  totalAmount: number
}

/**
 * Creates a Stripe Payment Intent for an event ticket purchase.
 *
 * This is the core checkout service function. It:
 * 1. Validates the event is published and chamber-managed
 * 2. Finds the ticket type and validates capacity
 * 3. Calculates base amount + service fee
 * 4. Creates the Stripe Payment Intent
 * 5. Creates a pending Order record (idempotent via stripePaymentIntentId)
 *
 * All monetary amounts are in minor units (cents for CAD/USD).
 * Prices are stored in minor units in the database (via currencyField).
 *
 * @throws Error if event/ticket validation fails or capacity is exceeded
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
  payload: Payload,
): Promise<PaymentIntentResult> {
  const { eventId, ticketType, quantity, purchaserName, purchaserEmail, contactId } = input

  // --- Validation ---
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1')
  }

  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
  })

  if (event.status !== 'published') {
    throw new Error(`Event "${event.title}" is not available for ticket sales (status: ${event.status})`)
  }

  if (event.ticketingType !== 'chamber-managed') {
    throw new Error(`Event "${event.title}" is not set up for chamber-managed ticketing`)
  }

  // Find the matching ticket type
  const ticket = event.ticketTypes?.find((t) => t.name === ticketType)
  if (!ticket) {
    throw new Error(`Ticket type "${ticketType}" not found on event "${event.title}"`)
  }

  // Check sale window
  const now = new Date()
  if (ticket.saleStart && new Date(ticket.saleStart) > now) {
    throw new Error(`Ticket sales for "${ticketType}" have not started yet`)
  }
  if (ticket.saleEnd && new Date(ticket.saleEnd) < now) {
    throw new Error(`Ticket sales for "${ticketType}" have ended`)
  }

  // Check capacity — count total tickets sold (confirmed + pending) for this ticket type
  const soldOrders = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { event: { equals: eventId } },
        { ticketType: { equals: ticketType } },
        { status: { in: ['pending', 'confirmed'] } },
      ],
    },
    limit: 10000,
    select: { quantity: true },
  })

  const ticketsSold = soldOrders.docs.reduce(
    (sum, order) => sum + ((order as { quantity?: number }).quantity ?? 0),
    0,
  )
  const remaining = ticket.capacity - ticketsSold

  if (quantity > remaining) {
    throw new Error(
      `Cannot purchase ${quantity} "${ticketType}" tickets — only ${remaining} remaining`,
    )
  }

  // --- Calculate amounts ---
  // ticket.price is in minor units (cents) thanks to currencyField
  const baseAmount = ticket.price * quantity
  const serviceFeeAmount = calculateServiceFee(baseAmount, event.serviceFee)
  const totalAmount = baseAmount + serviceFeeAmount

  // --- Create Stripe Payment Intent ---
  const stripe = getStripe()
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'cad',
    automatic_payment_methods: { enabled: true },
    metadata: {
      eventId: String(eventId),
      eventTitle: event.title,
      ticketType,
      quantity: String(quantity),
      purchaserEmail,
    },
    receipt_email: purchaserEmail,
    description: `${event.title} — ${quantity}× ${ticketType}`,
  })

  // --- Create pending order ---
  await payload.create({
    collection: 'orders',
    data: {
      purchaserName,
      purchaserEmail,
      event: eventId,
      ticketType,
      quantity,
      contact: contactId,
      stripePaymentIntentId: paymentIntent.id,
      totalAmount,
      serviceFeeAmount,
      status: 'pending',
    },
  })

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    baseAmount,
    serviceFeeAmount,
    totalAmount,
  }
}
