import type { Payload, PayloadRequest } from 'payload'

/**
 * Valid entity types for audit logging.
 */
export type AuditEntityType = 'member' | 'order' | 'payment' | 'contact'

/**
 * Who triggered the audited action.
 */
export type AuditActorType = 'staff' | 'member' | 'system' | 'webhook'

/**
 * Input for creating an audit log entry.
 */
export interface AuditLogEntry {
  entityType: AuditEntityType
  entityId: string
  action: string
  fromState?: string
  toState?: string
  actorId?: string
  actorType: AuditActorType
  metadata?: Record<string, unknown>
}

/**
 * Append-only audit logging service for critical state transitions.
 *
 * All critical transitions — member status changes, order status changes,
 * payment events, tier changes, manual overrides — go through this service.
 *
 * See ADR-7: Audit Logging for Critical Transitions.
 */
export class AuditService {
  constructor(private readonly payload: Payload) {}

  /**
   * Creates an audit log entry. This is the ONLY way to write to the audit-log collection.
   *
   * @param entry - The audit log data
   * @param req - PayloadRequest for transaction safety
   */
  async log(entry: AuditLogEntry, req?: PayloadRequest): Promise<void> {
    await this.payload.create({
      collection: 'audit-log',
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        fromState: entry.fromState,
        toState: entry.toState,
        actorId: entry.actorId,
        actorType: entry.actorType,
        metadata: entry.metadata,
      },
      req,
    })
  }
}
