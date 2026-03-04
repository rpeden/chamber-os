import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { MemberOnboardingPanel } from '../../BeforeDashboard/MemberOnboardingPanel'

/**
 * Server Component rendered above the Members collection list view.
 * Fetches tiers and contacts data for the onboarding panel.
 */
const MembersBeforeList: React.FC = async () => {
  const payload = await getPayload({ config })

  const [tierBreakdown, organizationContacts, personContacts] = await Promise.all([
    payload.find({
      collection: 'membership-tiers',
      sort: 'displayOrder',
      limit: 20,
      select: { name: true },
      depth: 0,
    }),
    payload.find({
      collection: 'contacts',
      sort: 'name',
      limit: 200,
      where: { type: { equals: 'organization' } },
      select: { name: true },
      depth: 0,
    }),
    payload.find({
      collection: 'contacts',
      sort: 'name',
      limit: 300,
      where: { type: { equals: 'person' } },
      select: { name: true },
      depth: 0,
    }),
  ])

  return (
    <MemberOnboardingPanel
      tiers={tierBreakdown.docs.map((tier) => ({ id: tier.id, name: tier.name }))}
      organizations={organizationContacts.docs.map((contact) => ({
        id: contact.id,
        name: contact.name,
      }))}
      people={personContacts.docs.map((contact) => ({ id: contact.id, name: contact.name }))}
    />
  )
}

export default MembersBeforeList
