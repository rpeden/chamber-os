import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MembershipService } from './membership-service'
import type { Payload } from 'payload'

function createMockPayload(memberStatus: string = 'pending') {
  return {
    findByID: vi.fn().mockResolvedValue({ id: 'mem-1', status: memberStatus }),
    update: vi.fn().mockResolvedValue({ id: 'mem-1', status: 'active' }),
    create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
  }
}

describe('MembershipService', () => {
  let service: MembershipService
  let mockPayload: ReturnType<typeof createMockPayload>

  beforeEach(() => {
    mockPayload = createMockPayload()
    service = new MembershipService(mockPayload as unknown as Payload)
  })

  describe('transitionStatus', () => {
    it('allows valid transition: pending → active', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'pending' })

      await service.transitionStatus('mem-1', 'active', 'user-1', 'staff')

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'members',
          id: 'mem-1',
          data: { status: 'active' },
        }),
      )
    })

    it('creates an audit log entry on transition', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'pending' })

      await service.transitionStatus('mem-1', 'active', 'user-1', 'staff')

      // AuditService calls payload.create for audit-log
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'audit-log',
          data: expect.objectContaining({
            entityType: 'member',
            entityId: 'mem-1',
            action: 'status_changed',
            fromState: 'pending',
            toState: 'active',
            actorId: 'user-1',
            actorType: 'staff',
          }),
        }),
      )
    })

    it('includes reason in audit metadata when provided', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'active' })

      await service.transitionStatus('mem-1', 'cancelled', 'user-1', 'staff', undefined, 'Non-payment')

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: { reason: 'Non-payment' },
          }),
        }),
      )
    })

    it('rejects invalid transition: pending → refunded', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'pending' })

      await expect(
        service.transitionStatus('mem-1', 'lapsed' as any, 'user-1', 'staff'),
      ).rejects.toThrow('Invalid membership transition')
    })

    it('rejects invalid transition: active → pending', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'active' })

      await expect(
        service.transitionStatus('mem-1', 'pending' as any, 'user-1', 'staff'),
      ).rejects.toThrow('Invalid membership transition')
    })
  })

  describe('convenience methods', () => {
    it('activate() calls transitionStatus with "active"', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'pending' })

      await service.activate('mem-1', 'user-1')

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'active' } }),
      )
    })

    it('cancel() calls transitionStatus with "cancelled"', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'active' })

      await service.cancel('mem-1', 'user-1', 'staff', undefined, 'Requested by member')

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'cancelled' } }),
      )
    })

    it('lapse() calls transitionStatus with "lapsed"', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'active' })

      await service.lapse('mem-1', 'system', 'system')

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'lapsed' } }),
      )
    })

    it('reinstate() calls transitionStatus with "reinstated"', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: 'cancelled' })

      await service.reinstate('mem-1', 'user-1')

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'reinstated' } }),
      )
    })
  })

  describe('valid transition matrix', () => {
    const cases: [string, string, boolean][] = [
      ['pending', 'active', true],
      ['pending', 'cancelled', true],
      ['pending', 'lapsed', false],
      ['pending', 'reinstated', false],
      ['active', 'lapsed', true],
      ['active', 'cancelled', true],
      ['active', 'pending', false],
      ['active', 'reinstated', false],
      ['lapsed', 'active', true],
      ['lapsed', 'reinstated', true],
      ['lapsed', 'cancelled', true],
      ['lapsed', 'pending', false],
      ['cancelled', 'reinstated', true],
      ['cancelled', 'active', false],
      ['cancelled', 'pending', false],
      ['cancelled', 'lapsed', false],
      ['reinstated', 'active', true],
      ['reinstated', 'lapsed', true],
      ['reinstated', 'cancelled', true],
      ['reinstated', 'pending', false],
    ]

    it.each(cases)('%s → %s should %s', async (from, to, shouldSucceed) => {
      mockPayload.findByID.mockResolvedValue({ id: 'mem-1', status: from })

      if (shouldSucceed) {
        await expect(
          service.transitionStatus('mem-1', to as any, 'user-1', 'staff'),
        ).resolves.toBeDefined()
      } else {
        await expect(
          service.transitionStatus('mem-1', to as any, 'user-1', 'staff'),
        ).rejects.toThrow('Invalid membership transition')
      }
    })
  })
})
