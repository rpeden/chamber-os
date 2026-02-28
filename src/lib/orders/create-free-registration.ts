import type { Payload, Where } from 'payload'
import { randomBytes } from 'crypto'
import { AuditService } from '../audit/audit-service'

export interface CreateFreeRegistrationInput {
  eventId: number
  /** The ticket type name to store on the order (e.g. 'General Registration') */
  ticketType: string
  quantity: number
  purchaserName: string
  purchaserEmail: string
  contactId?: number
}

export interface FreeRegistrationResult {
  orderId: string | number
  /** 64-char hex QR token for ticket validation */
  qrToken: string
}

/**
 * Creates a confirmed registration for a free event ticket.
 *
 * Handles two ticketing type variants:
 *   - `free-registration` — single implicit ticket, capacity from `registrationCapacity`
 *   - `chamber-managed` with a price=0 ticket — uses the ticket type's own capacity
 *
 * Unlike the paid checkout flow, this creates the Order directly in `confirmed`
 * status with a QR token — no Stripe payment required.
 *
 * See ADR-6: Order State Machine.
 */
export async function createFreeRegistration(
  input: CreateFreeRegistrationInput,
  payload: Payload,
): Promise<FreeRegistrationResult> {
  const { eventId, ticketType, quantity, purchaserName, purchaserEmail, contactId } = input

  if (quantity < 1) {
    throw new Error('Quantity must be at least 1')
  }

  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
  })

  if (event.status !== 'published') {
    throw new Error(`Event "${event.title}" is not available for registration (status: ${event.status})`)
  }

  const isFreeRegistration = event.ticketingType === 'free-registration'
  const isChamberManaged = event.ticketingType === 'chamber-managed'

  if (!isFreeRegistration && !isChamberManaged) {
    throw new Error(`Event "${event.title}" is not set up for registration`)
  }

  // For chamber-managed events, validate the ticket type exists and is actually free
  let capacity: number | null = null

  if (isChamberManaged) {
    const ticket = event.ticketTypes?.find((t: { name: string }) => t.name === ticketType)
    if (!ticket) {
      throw new Error(`Ticket type "${ticketType}" not found on event "${event.title}"`)
    }
    if (ticket.price > 0) {
      throw new Error(
        `Ticket type "${ticketType}" is not a free ticket — use the checkout flow for paid tickets`,
      )
    }
    capacity = ticket.capacity ?? null
  } else {
    // free-registration: capacity from registrationCapacity (null = unlimited)
    capacity = event.registrationCapacity ?? null
  }

  // Capacity check — count all non-refunded spots (sum of quantities)
  const baseWhere: Where = isChamberManaged
    ? {
        and: [
          { event: { equals: eventId } },
          { ticketType: { equals: ticketType } },
          { status: { in: ['pending', 'confirmed'] } },
        ],
      }
    : {
        and: [
          { event: { equals: eventId } },
          { status: { in: ['pending', 'confirmed'] } },
        ],
      }

  if (capacity !== null) {
    const soldOrders = await payload.find({
      collection: 'orders',
      where: baseWhere,
      limit: 10000,
      select: { quantity: true },
    })

    const taken = soldOrders.docs.reduce(
      (sum, o) => sum + ((o as { quantity?: number }).quantity ?? 0),
      0,
    )
    const remaining = capacity - taken

    if (quantity > remaining) {
      throw new Error(
        `Cannot register ${quantity} — only ${remaining} remaining`,
      )
    }
  }

  const qrToken = randomBytes(32).toString('hex')

  const order = await payload.create({
    collection: 'orders',
    data: {
      purchaserName,
      purchaserEmail,
      event: eventId,
      ticketType,
      quantity,
      contact: contactId,
      status: 'confirmed',
      totalAmount: 0,
      serviceFeeAmount: 0,
      qrToken,
    },
  })

  const audit = new AuditService(payload)
  await audit.log({
    entityType: 'order',
    entityId: String(order.id),
    action: 'created',
    toState: 'confirmed',
    actorId: 'system',
    actorType: 'system',
    metadata: { eventId: String(eventId), free: 'true' },
  })

  return {
    orderId: order.id,
    qrToken,
  }
}
