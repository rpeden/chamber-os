import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderService } from './order-service'
import type { Payload } from 'payload'

function createMockPayload() {
  return {
    find: vi.fn().mockResolvedValue({ docs: [] }),
    findByID: vi.fn().mockResolvedValue({ id: 'ord-1', status: 'confirmed' }),
    create: vi.fn().mockImplementation(async ({ data }) => ({
      id: 'new-order-1',
      ...data,
    })),
    update: vi.fn().mockImplementation(async ({ id, data }) => ({
      id,
      ...data,
    })),
  }
}

describe('OrderService', () => {
  let service: OrderService
  let mockPayload: ReturnType<typeof createMockPayload>

  beforeEach(() => {
    mockPayload = createMockPayload()
    service = new OrderService(mockPayload as unknown as Payload)
  })

  describe('createOrder', () => {
    const input = {
      purchaserName: 'Jane Smith',
      purchaserEmail: 'jane@example.com',
      eventId: 1,
      ticketType: 'general',
      quantity: 2,
      stripePaymentIntentId: 'pi_test_123',
      totalAmount: 5000,
      serviceFeeAmount: 250,
    }

    it('creates a new order in pending status', async () => {
      mockPayload.find.mockResolvedValue({ docs: [] })

      const result = await service.createOrder(input)

      // First create call: the order itself
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'orders',
          data: expect.objectContaining({
            purchaserName: 'Jane Smith',
            status: 'pending',
            stripePaymentIntentId: 'pi_test_123',
          }),
        }),
      )
    })

    it('creates an audit log entry', async () => {
      mockPayload.find.mockResolvedValue({ docs: [] })

      await service.createOrder(input)

      // Second create call: audit log
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'audit-log',
          data: expect.objectContaining({
            entityType: 'order',
            action: 'created',
            toState: 'pending',
            actorType: 'system',
          }),
        }),
      )
    })

    it('returns existing order if Payment Intent already processed (idempotent)', async () => {
      const existingOrder = { id: 'existing-1', status: 'pending' }
      mockPayload.find.mockResolvedValue({ docs: [existingOrder] })

      const result = await service.createOrder(input)

      expect(result).toBe(existingOrder)
      // Should NOT have called create for a new order
      expect(mockPayload.create).not.toHaveBeenCalled()
    })
  })

  describe('confirmFromWebhook', () => {
    it('confirms a pending order and generates QR token', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [{ id: 'ord-1', status: 'pending' }],
      })

      await service.confirmFromWebhook('pi_test_123')

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'orders',
          id: 'ord-1',
          data: expect.objectContaining({
            status: 'confirmed',
            qrToken: expect.any(String),
          }),
        }),
      )
    })

    it('generates a 64-character hex QR token', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [{ id: 'ord-1', status: 'pending' }],
      })

      await service.confirmFromWebhook('pi_test_123')

      const updateCall = mockPayload.update.mock.calls[0][0]
      expect(updateCall.data.qrToken).toMatch(/^[0-9a-f]{64}$/)
    })

    it('is idempotent — returns already-confirmed order without changes', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [{ id: 'ord-1', status: 'confirmed', qrToken: 'existing-token' }],
      })

      const result = await service.confirmFromWebhook('pi_test_123')

      expect(mockPayload.update).not.toHaveBeenCalled()
      expect(result).toEqual(
        expect.objectContaining({ id: 'ord-1', status: 'confirmed' }),
      )
    })

    it('throws if no order found for Payment Intent', async () => {
      mockPayload.find.mockResolvedValue({ docs: [] })

      await expect(
        service.confirmFromWebhook('pi_nonexistent'),
      ).rejects.toThrow('No order found for Payment Intent')
    })

    it('creates an audit log entry on confirmation', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [{ id: 'ord-1', status: 'pending' }],
      })

      await service.confirmFromWebhook('pi_test_123')

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'audit-log',
          data: expect.objectContaining({
            entityType: 'order',
            action: 'status_changed',
            fromState: 'pending',
            toState: 'confirmed',
            actorType: 'webhook',
          }),
        }),
      )
    })
  })

  describe('refund', () => {
    it('refunds a confirmed order', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'ord-1', status: 'confirmed' })

      await service.refund('ord-1', 'user-1', 'staff')

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'refunded' },
        }),
      )
    })

    it('rejects refund on a pending order', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'ord-1', status: 'pending' })

      await expect(
        service.refund('ord-1', 'user-1', 'staff'),
      ).rejects.toThrow('Invalid order transition')
    })

    it('rejects refund on an already-refunded order', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'ord-1', status: 'refunded' })

      await expect(
        service.refund('ord-1', 'user-1', 'staff'),
      ).rejects.toThrow('Invalid order transition')
    })

    it('includes reason in audit metadata when provided', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'ord-1', status: 'confirmed' })

      await service.refund('ord-1', 'user-1', 'staff', undefined, 'Event cancelled')

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: { reason: 'Event cancelled' },
          }),
        }),
      )
    })
  })
})
