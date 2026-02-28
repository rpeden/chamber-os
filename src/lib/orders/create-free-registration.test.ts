import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFreeRegistration } from './create-free-registration'
import type { Payload } from 'payload'

function createMockPayload() {
  return {
    findByID: vi.fn(),
    find: vi.fn().mockResolvedValue({ docs: [] }),
    create: vi.fn().mockImplementation(async ({ data }) => ({
      id: 'reg-1',
      ...data,
    })),
    update: vi.fn(),
  }
}

const freeRegistrationEvent = {
  id: 1,
  title: 'Monthly Luncheon',
  status: 'published',
  ticketingType: 'free-registration' as const,
  registrationCapacity: 50,
}

const chamberManagedFreeEvent = {
  id: 2,
  title: 'Community Workshop',
  status: 'published',
  ticketingType: 'chamber-managed' as const,
  ticketTypes: [
    { id: 'tt-1', name: 'General', price: 0, capacity: 30 },
  ],
  serviceFee: { feeType: 'none' as const, feeAmount: 0 },
}

describe('createFreeRegistration', () => {
  let mockPayload: ReturnType<typeof createMockPayload>

  beforeEach(() => {
    vi.clearAllMocks()
    mockPayload = createMockPayload()
  })

  describe('free-registration event type', () => {
    it('creates a confirmed order with a QR token', async () => {
      mockPayload.findByID.mockResolvedValue(freeRegistrationEvent)
      mockPayload.find.mockResolvedValue({ docs: [] })

      const result = await createFreeRegistration(
        {
          eventId: 1,
          ticketType: 'General Registration',
          quantity: 1,
          purchaserName: 'Alice',
          purchaserEmail: 'alice@example.com',
        },
        mockPayload as unknown as Payload,
      )

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'orders',
          data: expect.objectContaining({
            status: 'confirmed',
            purchaserName: 'Alice',
            purchaserEmail: 'alice@example.com',
            ticketType: 'General Registration',
            quantity: 1,
          }),
        }),
      )

      expect(result.qrToken).toBeTruthy()
      expect(result.qrToken.length).toBe(64) // 32 bytes hex
    })

    it('respects registrationCapacity', async () => {
      mockPayload.findByID.mockResolvedValue(freeRegistrationEvent)
      // 48 of 50 spots taken
      mockPayload.find.mockResolvedValue({
        docs: [{ quantity: 30 }, { quantity: 18 }],
      })

      await expect(
        createFreeRegistration(
          {
            eventId: 1,
            ticketType: 'General Registration',
            quantity: 5,
            purchaserName: 'Bob',
            purchaserEmail: 'bob@test.com',
          },
          mockPayload as unknown as Payload,
        ),
      ).rejects.toThrow(/only 2 remaining/)
    })

    it('allows unlimited registrations when capacity is null', async () => {
      mockPayload.findByID.mockResolvedValue({
        ...freeRegistrationEvent,
        registrationCapacity: null,
      })
      mockPayload.find.mockResolvedValue({ docs: [{ quantity: 9999 }] })

      // Should NOT throw
      await expect(
        createFreeRegistration(
          {
            eventId: 1,
            ticketType: 'General Registration',
            quantity: 50,
            purchaserName: 'Big Group',
            purchaserEmail: 'group@test.com',
          },
          mockPayload as unknown as Payload,
        ),
      ).resolves.toBeDefined()
    })
  })

  describe('chamber-managed event with free ticket', () => {
    it('creates a confirmed order for a price=0 ticket', async () => {
      mockPayload.findByID.mockResolvedValue(chamberManagedFreeEvent)
      mockPayload.find.mockResolvedValue({ docs: [] })

      const result = await createFreeRegistration(
        {
          eventId: 2,
          ticketType: 'General',
          quantity: 2,
          purchaserName: 'Carol',
          purchaserEmail: 'carol@test.com',
        },
        mockPayload as unknown as Payload,
      )

      expect(result.qrToken).toBeTruthy()
    })

    it('throws if ticket type is not free (price > 0)', async () => {
      mockPayload.findByID.mockResolvedValue({
        ...chamberManagedFreeEvent,
        ticketTypes: [{ id: 'tt-1', name: 'Paid Seat', price: 1500, capacity: 30 }],
      })

      await expect(
        createFreeRegistration(
          {
            eventId: 2,
            ticketType: 'Paid Seat',
            quantity: 1,
            purchaserName: 'Dave',
            purchaserEmail: 'dave@test.com',
          },
          mockPayload as unknown as Payload,
        ),
      ).rejects.toThrow('not a free ticket')
    })
  })

  describe('validation', () => {
    it('throws if event is not published', async () => {
      mockPayload.findByID.mockResolvedValue({ ...freeRegistrationEvent, status: 'draft' })

      await expect(
        createFreeRegistration(
          { eventId: 1, ticketType: 'General Registration', quantity: 1, purchaserName: 'X', purchaserEmail: 'x@test.com' },
          mockPayload as unknown as Payload,
        ),
      ).rejects.toThrow('not available')
    })

    it('throws if event is not a registerable type', async () => {
      mockPayload.findByID.mockResolvedValue({
        id: 1, title: 'Nope', status: 'published', ticketingType: 'none',
      })

      await expect(
        createFreeRegistration(
          { eventId: 1, ticketType: 'General Registration', quantity: 1, purchaserName: 'X', purchaserEmail: 'x@test.com' },
          mockPayload as unknown as Payload,
        ),
      ).rejects.toThrow('not set up for registration')
    })

    it('throws for quantity < 1', async () => {
      mockPayload.findByID.mockResolvedValue(freeRegistrationEvent)

      await expect(
        createFreeRegistration(
          { eventId: 1, ticketType: 'General Registration', quantity: 0, purchaserName: 'X', purchaserEmail: 'x@test.com' },
          mockPayload as unknown as Payload,
        ),
      ).rejects.toThrow('Quantity must be at least 1')
    })
  })
})
