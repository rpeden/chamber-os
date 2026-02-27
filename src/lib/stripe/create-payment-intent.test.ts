import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPaymentIntent } from './create-payment-intent'
import type { Payload } from 'payload'

/**
 * We mock the Stripe client at the module level so the service
 * doesn't actually call Stripe's API during tests.
 */
const mockPaymentIntentCreate = vi.fn()

vi.mock('./client', () => ({
  getStripe: () => ({
    paymentIntents: {
      create: mockPaymentIntentCreate,
    },
  }),
}))

function createMockPayload() {
  return {
    findByID: vi.fn(),
    find: vi.fn(),
    create: vi.fn().mockImplementation(async ({ data }) => ({
      id: 'new-order-1',
      ...data,
    })),
  }
}

describe('createPaymentIntent', () => {
  let mockPayload: ReturnType<typeof createMockPayload>

  const baseEvent = {
    id: 1,
    title: 'Annual Gala',
    status: 'published',
    ticketingType: 'chamber-managed' as const,
    ticketTypes: [
      {
        id: 'tt-1',
        name: 'General Admission',
        price: 2500, // stored in minor units (cents)
        capacity: 100,
        saleStart: null,
        saleEnd: null,
      },
      {
        id: 'tt-2',
        name: 'VIP',
        price: 7500,
        capacity: 20,
        saleStart: null,
        saleEnd: null,
      },
    ],
    serviceFee: {
      feeType: 'percentage' as const,
      feeAmount: 5,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPayload = createMockPayload()
    mockPaymentIntentCreate.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_abc',
    })
  })

  it('creates a payment intent with correct total (price × quantity + fee)', async () => {
    mockPayload.findByID.mockResolvedValue(baseEvent)
    mockPayload.find.mockResolvedValue({ docs: [] }) // no existing orders

    const result = await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'General Admission',
        quantity: 2,
        purchaserName: 'Jane Doe',
        purchaserEmail: 'jane@example.com',
      },
      mockPayload as unknown as Payload,
    )

    // Base: 2500 × 2 = 5000 cents
    // Fee: 5% of 5000 = 250 cents
    // Total: 5250 cents
    expect(mockPaymentIntentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5250,
        currency: 'cad',
        metadata: expect.objectContaining({
          eventId: '1',
          ticketType: 'General Admission',
          quantity: '2',
        }),
      }),
    )

    expect(result.clientSecret).toBe('pi_test_123_secret_abc')
    expect(result.totalAmount).toBe(5250)
    expect(result.serviceFeeAmount).toBe(250)
    expect(result.baseAmount).toBe(5000)
  })

  it('creates a pending order after creating the payment intent', async () => {
    mockPayload.findByID.mockResolvedValue(baseEvent)
    mockPayload.find.mockResolvedValue({ docs: [] })

    await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'General Admission',
        quantity: 1,
        purchaserName: 'Bob Smith',
        purchaserEmail: 'bob@example.com',
      },
      mockPayload as unknown as Payload,
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        data: expect.objectContaining({
          purchaserName: 'Bob Smith',
          purchaserEmail: 'bob@example.com',
          status: 'pending',
          stripePaymentIntentId: 'pi_test_123',
        }),
      }),
    )
  })

  it('throws if event is not published', async () => {
    mockPayload.findByID.mockResolvedValue({ ...baseEvent, status: 'draft' })

    await expect(
      createPaymentIntent(
        {
          eventId: 1,
          ticketType: 'General Admission',
          quantity: 1,
          purchaserName: 'Jane',
          purchaserEmail: 'jane@test.com',
        },
        mockPayload as unknown as Payload,
      ),
    ).rejects.toThrow('not available for ticket sales')
  })

  it('throws if ticketing type is not chamber-managed', async () => {
    mockPayload.findByID.mockResolvedValue({ ...baseEvent, ticketingType: 'none' })

    await expect(
      createPaymentIntent(
        {
          eventId: 1,
          ticketType: 'General Admission',
          quantity: 1,
          purchaserName: 'Jane',
          purchaserEmail: 'jane@test.com',
        },
        mockPayload as unknown as Payload,
      ),
    ).rejects.toThrow('not set up for chamber-managed ticketing')
  })

  it('throws if ticket type does not exist on the event', async () => {
    mockPayload.findByID.mockResolvedValue(baseEvent)

    await expect(
      createPaymentIntent(
        {
          eventId: 1,
          ticketType: 'Nonexistent Tier',
          quantity: 1,
          purchaserName: 'Jane',
          purchaserEmail: 'jane@test.com',
        },
        mockPayload as unknown as Payload,
      ),
    ).rejects.toThrow('Ticket type "Nonexistent Tier" not found')
  })

  it('throws if requested quantity exceeds remaining capacity', async () => {
    mockPayload.findByID.mockResolvedValue(baseEvent)
    // Simulate 95 tickets already sold for General Admission (capacity 100)
    mockPayload.find.mockResolvedValue({
      docs: [
        { quantity: 50 },
        { quantity: 45 },
      ],
    })

    await expect(
      createPaymentIntent(
        {
          eventId: 1,
          ticketType: 'General Admission',
          quantity: 10, // only 5 remain
          purchaserName: 'Jane',
          purchaserEmail: 'jane@test.com',
        },
        mockPayload as unknown as Payload,
      ),
    ).rejects.toThrow(/only 5 remaining/)
  })

  it('handles flat service fee correctly', async () => {
    mockPayload.findByID.mockResolvedValue({
      ...baseEvent,
      serviceFee: { feeType: 'flat', feeAmount: 200 },
    })
    mockPayload.find.mockResolvedValue({ docs: [] })

    const result = await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'General Admission',
        quantity: 3,
        purchaserName: 'Jane',
        purchaserEmail: 'jane@test.com',
      },
      mockPayload as unknown as Payload,
    )

    // Base: 2500 × 3 = 7500
    // Flat fee: 200 (per order, not per ticket)
    // Total: 7700
    expect(result.totalAmount).toBe(7700)
    expect(result.serviceFeeAmount).toBe(200)
  })

  it('handles no service fee correctly', async () => {
    mockPayload.findByID.mockResolvedValue({
      ...baseEvent,
      serviceFee: { feeType: 'none', feeAmount: 0 },
    })
    mockPayload.find.mockResolvedValue({ docs: [] })

    const result = await createPaymentIntent(
      {
        eventId: 1,
        ticketType: 'VIP',
        quantity: 1,
        purchaserName: 'Jane',
        purchaserEmail: 'jane@test.com',
      },
      mockPayload as unknown as Payload,
    )

    // Base: 7500 × 1 = 7500
    // No fee
    // Total: 7500
    expect(result.totalAmount).toBe(7500)
    expect(result.serviceFeeAmount).toBe(0)
  })

  it('rejects zero or negative quantity', async () => {
    mockPayload.findByID.mockResolvedValue(baseEvent)

    await expect(
      createPaymentIntent(
        {
          eventId: 1,
          ticketType: 'General Admission',
          quantity: 0,
          purchaserName: 'Jane',
          purchaserEmail: 'jane@test.com',
        },
        mockPayload as unknown as Payload,
      ),
    ).rejects.toThrow('Quantity must be at least 1')
  })
})
