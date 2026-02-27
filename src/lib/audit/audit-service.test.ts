import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditService } from './audit-service'
import type { Payload } from 'payload'

describe('AuditService', () => {
  let service: AuditService
  let mockPayload: { create: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockPayload = {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    }
    service = new AuditService(mockPayload as unknown as Payload)
  })

  it('creates an audit log entry with all fields', async () => {
    await service.log({
      entityType: 'member',
      entityId: 'mem-123',
      action: 'status_changed',
      fromState: 'pending',
      toState: 'active',
      actorId: 'user-1',
      actorType: 'staff',
      metadata: { reason: 'approved' },
    })

    expect(mockPayload.create).toHaveBeenCalledOnce()
    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'audit-log',
      data: {
        entityType: 'member',
        entityId: 'mem-123',
        action: 'status_changed',
        fromState: 'pending',
        toState: 'active',
        actorId: 'user-1',
        actorType: 'staff',
        metadata: { reason: 'approved' },
      },
      req: undefined,
    })
  })

  it('passes req for transaction safety', async () => {
    const mockReq = { payload: mockPayload } as unknown

    await service.log(
      {
        entityType: 'order',
        entityId: 'ord-1',
        action: 'created',
        actorType: 'system',
      },
      mockReq as any,
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({ req: mockReq }),
    )
  })

  it('handles entries with optional fields omitted', async () => {
    await service.log({
      entityType: 'contact',
      entityId: 'con-1',
      action: 'updated',
      actorType: 'staff',
    })

    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'audit-log',
      data: {
        entityType: 'contact',
        entityId: 'con-1',
        action: 'updated',
        fromState: undefined,
        toState: undefined,
        actorId: undefined,
        actorType: 'staff',
        metadata: undefined,
      },
      req: undefined,
    })
  })
})
