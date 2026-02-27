import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderService } from '@/lib/orders/order-service'
import { createPaymentIntent } from '@/lib/stripe/create-payment-intent'
import type { Payload } from 'payload'

/**
 * Integration test for the checkout → webhook → order confirmation flow.
 *
 * These tests exercise the full lifecycle from Payment Intent creation
 * through webhook-driven order confirmation, verifying the service layer
 * contracts and state machine transitions (ADR-6).
 *
 * Stripe API calls are mocked at the client level — the business logic
 * (fee calculation, capacity checking, state transitions, audit logging)
 * is tested for real.
 */

const mockPaymentIntentCreate = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    paymentIntents: {
      create: mockPaymentIntentCreate,
    },
  }),
}))

/**
 * In-memory order store to simulate database behavior across
 * createPaymentIntent and OrderService calls.
 */
function createMockPayload() {
  const orders: Record<string, Record<string, unknown>> = {}
  let orderIdCounter = 1

  return {
    findByID: vi.fn().mockImplementation(async ({ collection, id }: { collection: string; id: string | number }) => {
      if (collection === 'events') {
        // Return a test event
        return {
          id: 1,
          title: 'Annual Gala',
          status: 'published',
          ticketingType: 'chamber-managed',
          ticketTypes: [
            {
              id: 'tt-1',
              name: 'General Admission',
              price: 2500,
              capacity: 100,
            },
          ],
          serviceFee: { feeType: 'percentage', feeAmount: 5 },
        }
      }
      if (collection === 'orders') {
        const order = orders[String(id)]
        if (!order) throw new Error(`Order ${id} not found`)
        return order
      }
      return null
    }),

    find: vi.fn().mockImplementation(async ({ collection, where }: { collection: string; where?: Record<string, unknown> }) => {
      if (collection === 'orders') {
        const docs = Object.values(orders).filter((order) => {
          if (where?.stripePaymentIntentId) {
            const equals = (where.stripePaymentIntentId as Record<string, string>).equals
            return order.stripePaymentIntentId === equals
          }
          // For capacity check — return all matching orders
          if (where?.and) {
            const conditions = where.and as Array<Record<string, Record<string, unknown>>>
            return conditions.every((cond) => {
              const [key] = Object.keys(cond)
              const op = cond[key]
              if ('equals' in op) return order[key] === op.equals
              if ('in' in op) return (op.in as string[]).includes(order[key] as string)
              return true
            })
          }
          return true
        })
        return { docs, totalDocs: docs.length }
      }
      return { docs: [], totalDocs: 0 }
    }),

    create: vi.fn().mockImplementation(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection === 'orders') {
        const id = orderIdCounter++
        const order = { id, ...data }
        orders[String(id)] = order
        return order
      }
      // Audit log — just return
      return { id: `audit-${orderIdCounter++}`, ...data }
    }),

    update: vi.fn().mockImplementation(async ({ collection, id, data }: { collection: string; id: string | number; data: Record<string, unknown> }) => {
      if (collection === 'orders') {
        const order = orders[String(id)]
        if (!order) throw new Error(`Order ${id} not found`)
        Object.assign(order, data)
        return order
      }
      return { id, ...data }
    }),
  }
}

describe('Checkout → Webhook → Order Confirmation Flow', () => {
  let mockPayload: ReturnType<typeof createMockPayload>

  beforeEach(() => {
    // clearAllMocks() does not reset queued mockResolvedValueOnce values.
    // Use mockReset() so each test starts with a clean Stripe mock state.
    mockPaymentIntentCreate.mockReset()
    mockPayload = createMockPayload()
    mockPaymentIntentCreate.mockResolvedValue({
      id: 'pi_test_integration_123',
      client_secret: 'pi_test_integration_123_secret_abc',
    })
  })

  it('completes full checkout → webhook confirmation cycle', async () => {
    const payload = mockPayload as unknown as Payload

    // Step 1: Create Payment Intent (checkout)
    const result = await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'General Admission',
        quantity: 2,
        purchaserName: 'Alice Johnson',
        purchaserEmail: 'alice@example.com',
      },
      payload,
    )

    expect(result.clientSecret).toBe('pi_test_integration_123_secret_abc')
    expect(result.baseAmount).toBe(5000) // 2500 × 2
    expect(result.serviceFeeAmount).toBe(250) // 5% of 5000
    expect(result.totalAmount).toBe(5250)

    // Verify order was created in pending state
    const pendingOrder = mockPayload.create.mock.calls.find(
      (call) => (call[0] as { collection: string }).collection === 'orders',
    )
    expect(pendingOrder).toBeTruthy()
    expect((pendingOrder![0] as { data: Record<string, unknown> }).data.status).toBe('pending')

    // Step 2: Webhook confirms the order
    const orderService = new OrderService(payload)
    const confirmed = await orderService.confirmFromWebhook('pi_test_integration_123')

    // Verify order transitioned to confirmed
    expect((confirmed as Record<string, unknown>).status).toBe('confirmed')
    expect((confirmed as Record<string, unknown>).qrToken).toBeTruthy()
    expect(typeof (confirmed as Record<string, unknown>).qrToken).toBe('string')
    expect(((confirmed as Record<string, unknown>).qrToken as string).length).toBe(64) // 32 bytes hex
  })

  it('webhook is idempotent — confirming twice returns same order', async () => {
    const payload = mockPayload as unknown as Payload

    // Create order via checkout
    await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'General Admission',
        quantity: 1,
        purchaserName: 'Bob',
        purchaserEmail: 'bob@example.com',
      },
      payload,
    )

    const orderService = new OrderService(payload)

    // First confirmation
    const first = await orderService.confirmFromWebhook('pi_test_integration_123')
    const qrToken = (first as Record<string, unknown>).qrToken

    // Second confirmation — should not throw, should return same order
    const second = await orderService.confirmFromWebhook('pi_test_integration_123')
    expect((second as Record<string, unknown>).status).toBe('confirmed')
    expect((second as Record<string, unknown>).qrToken).toBe(qrToken)
  })

  it('capacity is enforced across multiple purchases', async () => {
    const payload = mockPayload as unknown as Payload

    // Use a low-capacity event
    mockPayload.findByID.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'events') {
        return {
          id: 2,
          title: 'Small Workshop',
          status: 'published',
          ticketingType: 'chamber-managed',
          ticketTypes: [
            { id: 'tt-1', name: 'Seat', price: 1000, capacity: 3 },
          ],
          serviceFee: { feeType: 'none', feeAmount: 0 },
        }
      }
      // Return order from in-memory store for other lookups
      return null
    })

    // First purchase: 2 tickets (2 of 3 capacity used)
    mockPaymentIntentCreate.mockResolvedValueOnce({
      id: 'pi_cap_1',
      client_secret: 'pi_cap_1_secret',
    })

    await createPaymentIntent(
      {
        eventId: 2,
        ticketType: 'Seat',
        quantity: 2,
        purchaserName: 'First',
        purchaserEmail: 'first@test.com',
      },
      payload,
    )

    // Second purchase: 2 more tickets (only 1 remaining) — should fail
    mockPaymentIntentCreate.mockResolvedValueOnce({
      id: 'pi_cap_2',
      client_secret: 'pi_cap_2_secret',
    })

    await expect(
      createPaymentIntent(
        {
          eventId: 2,
          ticketType: 'Seat',
          quantity: 2,
          purchaserName: 'Second',
          purchaserEmail: 'second@test.com',
        },
        payload,
      ),
    ).rejects.toThrow(/only 1 remaining/)

    // Capacity is validated before Stripe call; only the first checkout should hit Stripe.
    expect(mockPaymentIntentCreate).toHaveBeenCalledTimes(1)
  })

  it('full lifecycle: checkout → confirm → refund', async () => {
    const payload = mockPayload as unknown as Payload

    // Checkout
    const checkout = await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'General Admission',
        quantity: 1,
        purchaserName: 'Charlie',
        purchaserEmail: 'charlie@test.com',
      },
      payload,
    )

    const orderService = new OrderService(payload)

    // Confirm via webhook
    const confirmed = await orderService.confirmFromWebhook(checkout.paymentIntentId)
    const orderId = (confirmed as Record<string, unknown>).id

    // Refund
    const refunded = await orderService.refund(orderId as string, 'staff-1', 'staff')
    expect((refunded as Record<string, unknown>).status).toBe('refunded')
  })

  it('rejects invalid transition: pending → refunded', async () => {
    const payload = mockPayload as unknown as Payload

    // Checkout (creates pending order)
    await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'General Admission',
        quantity: 1,
        purchaserName: 'Diana',
        purchaserEmail: 'diana@test.com',
      },
      payload,
    )

    const orderService = new OrderService(payload)

    // Try to refund a pending order — should fail (must confirm first)
    // The orderId is 1 (first created order)
    // But we need findByID to return the pending order
    mockPayload.findByID.mockImplementation(async ({ collection, id }: { collection: string; id: string | number }) => {
      if (collection === 'orders') return { id, status: 'pending' }
      return null
    })

    await expect(
      orderService.refund(1, 'staff-1', 'staff'),
    ).rejects.toThrow('Invalid order transition: pending → refunded')
  })
})
