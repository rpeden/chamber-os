import type { Payload, PayloadRequest } from 'payload'
import { AuditService } from '../audit/audit-service'

/**
 * Input for creating a new organization member.
 */
export interface NewOrgMemberInput {
  orgName: string
  orgEmail?: string
  orgPhone?: string
  orgAddress?: {
    street?: string
    city?: string
    province?: string
    postalCode?: string
  }
  primaryContactName: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  membershipTierId?: number
}

/**
 * Input for creating a new individual member (person).
 */
export interface NewIndividualMemberInput {
  name: string
  email?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    province?: string
    postalCode?: string
  }
  membershipTierId?: number
}

/**
 * Input for onboarding when organization Contact already exists.
 */
export interface ExistingOrgMemberInput {
  orgContactId: string | number
  primaryContactId?: string | number
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  membershipTierId?: number
}

/**
 * Result of an onboarding operation.
 */
export interface OnboardingResult {
  contactId: string | number
  memberId: string | number
  primaryContactId?: string | number
}

/**
 * Centralized onboarding logic for creating new members.
 *
 * Used by both staff-assisted onboarding (admin UI) and future self-serve
 * flows (member portal). Creates Contact + Member records atomically.
 *
 * See ADR-2: Contacts and Members are separate.
 * See ADR-3: Business logic in services.
 */
export class OnboardingService {
  private readonly audit: AuditService

  constructor(private readonly payload: Payload) {
    this.audit = new AuditService(payload)
  }

  /**
   * Onboards a new organization member.
   *
   * Creates:
   * 1. Organization Contact
   * 2. Primary Contact (person) linked to the org
   * 3. Member record linked to the org Contact
   *
   * All operations use the same request for transaction safety.
   */
  async onboardOrganization(
    input: NewOrgMemberInput,
    actorId: string,
    req?: PayloadRequest,
  ): Promise<OnboardingResult> {
    // 1. Create or find the organization Contact
    const orgContact = await this.payload.create({
      collection: 'contacts',
      data: {
        name: input.orgName,
        email: input.orgEmail,
        phone: input.orgPhone,
        type: 'organization',
        address: input.orgAddress,
      },
      req,
    })

    // 2. Create the primary contact person, linked to the org
    const primaryContact = await this.payload.create({
      collection: 'contacts',
      data: {
        name: input.primaryContactName,
        email: input.primaryContactEmail,
        phone: input.primaryContactPhone,
        type: 'person',
        organization: orgContact.id,
      },
      req,
    })

    // 3. Create the Member record
    const member = await this.payload.create({
      collection: 'members',
      data: {
        contact: orgContact.id,
        primaryContact: primaryContact.id,
        membershipTier: input.membershipTierId,
        status: 'pending',
        joinedDate: new Date().toISOString(),
      },
      req,
    })

    // 4. Audit log
    await this.audit.log(
      {
        entityType: 'member',
        entityId: String(member.id),
        action: 'onboarded',
        toState: 'pending',
        actorId,
        actorType: 'staff',
        metadata: {
          type: 'organization',
          orgContactId: String(orgContact.id),
          primaryContactId: String(primaryContact.id),
        },
      },
      req,
    )

    return {
      contactId: orgContact.id,
      memberId: member.id,
      primaryContactId: primaryContact.id,
    }
  }

  /**
   * Onboards a new individual member (person, not org).
   *
   * Shortcut that creates a person Contact + Member in one step.
   */
  async onboardIndividual(
    input: NewIndividualMemberInput,
    actorId: string,
    req?: PayloadRequest,
  ): Promise<OnboardingResult> {
    // 1. Create the person Contact
    const contact = await this.payload.create({
      collection: 'contacts',
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        type: 'person',
        address: input.address,
      },
      req,
    })

    // 2. Create the Member record
    const member = await this.payload.create({
      collection: 'members',
      data: {
        contact: contact.id,
        membershipTier: input.membershipTierId,
        status: 'pending',
        joinedDate: new Date().toISOString(),
      },
      req,
    })

    // 3. Audit log
    await this.audit.log(
      {
        entityType: 'member',
        entityId: String(member.id),
        action: 'onboarded',
        toState: 'pending',
        actorId,
        actorType: 'staff',
        metadata: {
          type: 'individual',
          contactId: String(contact.id),
        },
      },
      req,
    )

    return {
      contactId: contact.id,
      memberId: member.id,
    }
  }

  /**
   * Onboards a member using an existing organization Contact.
   *
   * Supports either selecting an existing primary contact or creating one.
   */
  async onboardOrganizationFromExisting(
    input: ExistingOrgMemberInput,
    actorId: string,
    req?: PayloadRequest,
  ): Promise<OnboardingResult> {
    const orgContactId =
      typeof input.orgContactId === 'string' ? Number(input.orgContactId) : input.orgContactId

    const orgContact = await this.payload.findByID({
      collection: 'contacts',
      id: orgContactId,
      depth: 0,
      req,
    })

    if (!orgContact || orgContact.type !== 'organization') {
      throw new Error('Selected contact is not an organization')
    }

    let primaryContactId = input.primaryContactId

    if (typeof primaryContactId === 'string') {
      primaryContactId = Number(primaryContactId)
    }

    if (!primaryContactId && input.primaryContactName) {
      const createdPrimaryContact = await this.payload.create({
        collection: 'contacts',
        data: {
          name: input.primaryContactName,
          email: input.primaryContactEmail,
          phone: input.primaryContactPhone,
          type: 'person',
          organization: orgContact.id,
        },
        req,
      })

      primaryContactId = createdPrimaryContact.id
    }

    const member = await this.payload.create({
      collection: 'members',
      data: {
        contact: orgContact.id,
        primaryContact: primaryContactId,
        membershipTier: input.membershipTierId,
        status: 'pending',
        joinedDate: new Date().toISOString(),
      },
      req,
    })

    await this.audit.log(
      {
        entityType: 'member',
        entityId: String(member.id),
        action: 'onboarded',
        toState: 'pending',
        actorId,
        actorType: 'staff',
        metadata: {
          type: 'organization-existing',
          orgContactId: String(orgContact.id),
          primaryContactId: primaryContactId ? String(primaryContactId) : undefined,
        },
      },
      req,
    )

    return {
      contactId: orgContact.id,
      memberId: member.id,
      primaryContactId,
    }
  }
}
