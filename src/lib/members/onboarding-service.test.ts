import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'

import { OnboardingService } from './onboarding-service'

function createMockPayload() {
  return {
    create: vi.fn().mockImplementation(async ({ collection, data }) => {
      if (collection === 'contacts') {
        return { id: data.name?.includes('Org') ? 101 : 201, ...data }
      }

      if (collection === 'members') {
        return { id: 301, ...data }
      }

      if (collection === 'audit-log') {
        return { id: 401, ...data }
      }

      return { id: 999, ...data }
    }),
    findByID: vi.fn().mockResolvedValue({ id: 101, type: 'organization', name: 'Existing Org' }),
  }
}

describe('OnboardingService', () => {
  let service: OnboardingService
  let mockPayload: ReturnType<typeof createMockPayload>

  beforeEach(() => {
    mockPayload = createMockPayload()
    service = new OnboardingService(mockPayload as unknown as Payload)
  })

  it('onboards an individual member', async () => {
    const result = await service.onboardIndividual(
      {
        name: 'Pat Member',
        email: 'pat@example.com',
        membershipTierId: 1,
      },
      'staff-1',
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'contacts',
        data: expect.objectContaining({ name: 'Pat Member', type: 'person' }),
      }),
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'members',
        data: expect.objectContaining({ membershipTier: 1, status: 'pending' }),
      }),
    )

    expect(result.memberId).toBe(301)
  })

  it('onboards an organization using existing org + existing primary contact', async () => {
    const result = await service.onboardOrganizationFromExisting(
      {
        orgContactId: 101,
        primaryContactId: 202,
        membershipTierId: 2,
      },
      'staff-1',
    )

    expect(mockPayload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'contacts', id: 101 }),
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'members',
        data: expect.objectContaining({
          contact: 101,
          primaryContact: 202,
          membershipTier: 2,
        }),
      }),
    )

    expect(result.contactId).toBe(101)
    expect(result.primaryContactId).toBe(202)
  })

  it('creates a new primary contact when onboarding existing org without primaryContactId', async () => {
    await service.onboardOrganizationFromExisting(
      {
        orgContactId: 101,
        primaryContactName: 'New Contact',
        primaryContactEmail: 'new-contact@example.com',
      },
      'staff-1',
    )

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'contacts',
        data: expect.objectContaining({
          name: 'New Contact',
          type: 'person',
          organization: 101,
        }),
      }),
    )
  })
})
