import type { Payload, PayloadRequest } from 'payload'
import { AuditService } from '../audit/audit-service'
import { randomBytes } from 'crypto'

/** Valid order status values. */
export type OrderStatus = 'pending' | 'confirmed' | 'refunded'

/**
 * Allowed status transitions for orders.
 * See ADR-6: Order State Machine with Explicit Transitions.
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed'],
  confirmed: ['refunded'],
  refunded: [],
}

/**
 * Input for creating a new order (when a Payment Intent is created).
 */
export interface CreateOrderInput {
  purchaserName: string
  purchaserEmail: string
  eventId: number
  ticketType: string
  quantity: number
  contactId?: number
  stripePaymentIntentId: string
  /** Total charged amount in minor units (e.g., cents for USD/CAD) */
  totalAmount: number
  /** Service fee in minor units, tracked separately for reporting */
  serviceFeeAmount: number
}

/**
 * Service for order lifecycle management.
 *
 * All status transitions go through this service to ensure:
 * 1. Only valid transitions are allowed (pending → confirmed → refunded)
 * 2. Idempotent webhook processing (no duplicate orders)
 * 3. QR token generation on confirmation
 * 4. Every transition is audit-logged (ADR-7)
 *
 * See ADR-3: Business logic lives in services, not hooks.
 * See ADR-6: Order State Machine with Explicit Transitions.
 */
export class OrderService {
  private readonly audit: AuditService

  constructor(private readonly payload: Payload) {
    this.audit = new AuditService(payload)
  }

  /**
   * Creates a new order in pending status.
   * Called when a Stripe Payment Intent is created.
   *
   * @throws Error if an order with the same stripePaymentIntentId already exists
   */
  async createOrder(input: CreateOrderInput, req?: PayloadRequest): Promise<unknown> {
    // Idempotency check: ensure no duplicate order for this Payment Intent
    const existing = await this.payload.find({
      collection: 'orders',
      where: {
        stripePaymentIntentId: { equals: input.stripePaymentIntentId },
      },
      limit: 1,
      req,
    })

    if (existing.docs.length > 0) {
      // Already created — return existing order (idempotent)
      return existing.docs[0]
    }

    const order = await this.payload.create({
      collection: 'orders',
      data: {
        purchaserName: input.purchaserName,
        purchaserEmail: input.purchaserEmail,
        event: input.eventId,
        ticketType: input.ticketType,
        quantity: input.quantity,
        contact: input.contactId,
        stripePaymentIntentId: input.stripePaymentIntentId,
        totalAmount: input.totalAmount,
        serviceFeeAmount: input.serviceFeeAmount,
        status: 'pending',
      },
      req,
    })

    await this.audit.log(
      {
        entityType: 'order',
        entityId: String(order.id),
        action: 'created',
        toState: 'pending',
        actorId: 'system',
        actorType: 'system',
        metadata: {
          stripePaymentIntentId: input.stripePaymentIntentId,
          eventId: String(input.eventId),
        },
      },
      req,
    )

    return order
  }

  /**
   * Confirms an order after successful payment (webhook callback).
   *
   * Idempotent: if the order is already confirmed, returns it without changes.
   * Generates a QR token for ticket validation.
   *
   * @param stripePaymentIntentId - The Stripe Payment Intent ID from the webhook
   * @param req - PayloadRequest for transaction safety
   */
  async confirmFromWebhook(
    stripePaymentIntentId: string,
    req?: PayloadRequest,
  ): Promise<unknown> {
    const result = await this.payload.find({
      collection: 'orders',
      where: {
        stripePaymentIntentId: { equals: stripePaymentIntentId },
      },
      limit: 1,
      req,
    })

    if (result.docs.length === 0) {
      throw new Error(`No order found for Payment Intent: ${stripePaymentIntentId}`)
    }

    const order = result.docs[0] as { id: string | number; status: string; qrToken?: string }

    // Idempotent: already confirmed
    if (order.status === 'confirmed') {
      return order
    }

    this.validateTransition(order.status as OrderStatus, 'confirmed', order.id)

    const qrToken = this.generateQrToken()

    const updated = await this.payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        status: 'confirmed',
        qrToken,
      },
      req,
    })

    await this.audit.log(
      {
        entityType: 'order',
        entityId: String(order.id),
        action: 'status_changed',
        fromState: 'pending',
        toState: 'confirmed',
        actorId: 'webhook',
        actorType: 'webhook',
        metadata: { stripePaymentIntentId },
      },
      req,
    )

    return updated
  }

  /**
   * Refunds an order. Called by staff or by a Stripe refund webhook.
   */
  async refund(
    orderId: string | number,
    actorId: string,
    actorType: 'staff' | 'webhook' = 'staff',
    req?: PayloadRequest,
    reason?: string,
  ): Promise<unknown> {
    const order = await this.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      req,
    })

    this.validateTransition(order.status as OrderStatus, 'refunded', orderId)

    const updated = await this.payload.update({
      collection: 'orders',
      id: orderId,
      data: { status: 'refunded' },
      req,
    })

    await this.audit.log(
      {
        entityType: 'order',
        entityId: String(orderId),
        action: 'status_changed',
        fromState: 'confirmed',
        toState: 'refunded',
        actorId,
        actorType,
        metadata: reason ? { reason } : undefined,
      },
      req,
    )

    return updated
  }

  /**
   * Validates that a status transition is allowed.
   * @throws Error if the transition is invalid
   */
  private validateTransition(
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    orderId: string | number,
  ): void {
    if (!VALID_TRANSITIONS[fromStatus]?.includes(toStatus)) {
      throw new Error(
        `Invalid order transition: ${fromStatus} → ${toStatus} for order ${orderId}`,
      )
    }
  }

  /**
   * Generates a cryptographically random QR token for ticket validation.
   */
  private generateQrToken(): string {
    return randomBytes(32).toString('hex')
  }
}
