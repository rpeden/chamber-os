import type { Payload, PayloadRequest } from 'payload'
import { AuditService } from '../audit/audit-service'

/** Valid member status values. */
export type MemberStatus = 'pending' | 'active' | 'lapsed' | 'cancelled' | 'reinstated'

/**
 * Allowed status transitions for membership lifecycle.
 * Key is the current status, value is an array of valid next statuses.
 */
const VALID_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  pending: ['active', 'cancelled'],
  active: ['lapsed', 'cancelled'],
  lapsed: ['active', 'reinstated', 'cancelled'],
  cancelled: ['reinstated'],
  reinstated: ['active', 'lapsed', 'cancelled'],
}

/**
 * Service for membership lifecycle management.
 *
 * All status transitions go through this service to ensure:
 * 1. Only valid transitions are allowed
 * 2. Every transition is audit-logged (ADR-7)
 * 3. Business rules are enforced consistently
 *
 * See ADR-3: Business logic lives in services, not hooks.
 */
export class MembershipService {
  private readonly audit: AuditService

  constructor(private readonly payload: Payload) {
    this.audit = new AuditService(payload)
  }

  /**
   * Transitions a member's status with validation and audit logging.
   *
   * @param memberId - The member document ID
   * @param toStatus - The target status
   * @param actorId - Who is performing this action (user ID or 'system')
   * @param actorType - Type of actor
   * @param req - PayloadRequest for transaction safety
   * @param reason - Optional reason for the transition (stored in audit metadata)
   * @returns The updated member document
   * @throws Error if the transition is not valid
   */
  async transitionStatus(
    memberId: string | number,
    toStatus: MemberStatus,
    actorId: string,
    actorType: 'staff' | 'member' | 'system',
    req?: PayloadRequest,
    reason?: string,
  ): Promise<unknown> {
    const member = await this.payload.findByID({
      collection: 'members',
      id: memberId,
      depth: 0,
      req,
    })

    const fromStatus = member.status as MemberStatus

    if (!VALID_TRANSITIONS[fromStatus]?.includes(toStatus)) {
      throw new Error(
        `Invalid membership transition: ${fromStatus} → ${toStatus} for member ${memberId}`,
      )
    }

    const updated = await this.payload.update({
      collection: 'members',
      id: memberId,
      data: { status: toStatus },
      req,
    })

    await this.audit.log(
      {
        entityType: 'member',
        entityId: String(memberId),
        action: 'status_changed',
        fromState: fromStatus,
        toState: toStatus,
        actorId,
        actorType,
        metadata: reason ? { reason } : undefined,
      },
      req,
    )

    return updated
  }

  /**
   * Activates a pending or reinstated member.
   * Convenience wrapper around transitionStatus.
   */
  async activate(
    memberId: string | number,
    actorId: string,
    actorType: 'staff' | 'member' | 'system' = 'staff',
    req?: PayloadRequest,
  ): Promise<unknown> {
    return this.transitionStatus(memberId, 'active', actorId, actorType, req)
  }

  /**
   * Marks a member as lapsed (e.g., renewal date passed without payment).
   */
  async lapse(
    memberId: string | number,
    actorId: string,
    actorType: 'staff' | 'system' = 'system',
    req?: PayloadRequest,
    reason?: string,
  ): Promise<unknown> {
    return this.transitionStatus(memberId, 'lapsed', actorId, actorType, req, reason)
  }

  /**
   * Cancels a membership.
   */
  async cancel(
    memberId: string | number,
    actorId: string,
    actorType: 'staff' | 'member' | 'system' = 'staff',
    req?: PayloadRequest,
    reason?: string,
  ): Promise<unknown> {
    return this.transitionStatus(memberId, 'cancelled', actorId, actorType, req, reason)
  }

  /**
   * Reinstates a cancelled or lapsed membership.
   */
  async reinstate(
    memberId: string | number,
    actorId: string,
    actorType: 'staff' | 'system' = 'staff',
    req?: PayloadRequest,
    reason?: string,
  ): Promise<unknown> {
    return this.transitionStatus(memberId, 'reinstated', actorId, actorType, req, reason)
  }
}
