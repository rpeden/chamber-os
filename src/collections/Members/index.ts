import type { CollectionAfterReadHook, CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

/**
 * Populates the virtual `title` field with the contact's name
 * so the admin list view and page header show something useful
 * instead of a raw database ID.
 */
const populateMemberTitle: CollectionAfterReadHook = async ({ doc, req }) => {
  if (!doc.contact) return doc

  const contactId = typeof doc.contact === 'object' ? doc.contact.id : doc.contact

  if (!contactId) return doc

  // If the contact was already populated (depth > 0), grab the name directly
  if (typeof doc.contact === 'object' && doc.contact.name) {
    doc.title = doc.contact.name
    return doc
  }

  // Otherwise fetch it
  const contact = await req.payload.findByID({
    collection: 'contacts',
    id: contactId,
    depth: 0,
    select: { name: true },
  })

  doc.title = contact?.name ?? `Member ${contactId}`
  return doc
}

/**
 * Members collection — represents the membership relationship.
 *
 * A Member record links a Contact (org or person) to a Membership Tier
 * and tracks the lifecycle of that membership (pending → active → lapsed
 * → cancelled → reinstated).
 *
 * See ADR-2: Contacts and Members are separate concepts.
 * See ADR-3: Status transitions go through MembershipService, not raw field updates.
 */
export const Members: CollectionConfig = {
  slug: 'members',
  labels: {
    singular: 'Member',
    plural: 'Members',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated, // Future: members can read own record via portal with overrideAccess: false
    update: authenticated,
  },
  defaultSort: '-renewalDate',
  admin: {
    group: 'Members & Contacts',
    defaultColumns: ['contact', 'status', 'membershipTier', 'renewalDate', 'joinedDate'],
    listSearchableFields: ['contact'],
    useAsTitle: 'title',
    description:
      'Use column header filters to view members by status (e.g., "lapsed", "cancelled") or by tier. Click column headers to sort.',
  },
  fields: [
    // Virtual title field — populated by afterRead hook from the linked contact's name
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            // Return synthetic value — the real population happens in the collection hook
            return siblingData?.title
          },
        ],
      },
    },
    // Core relationships
    {
      name: 'contact',
      type: 'relationship',
      relationTo: 'contacts',
      required: true,
      admin: {
        description:
          'The entity that IS the member — an organization or a person Contact.',
      },
    },
    {
      name: 'primaryContact',
      type: 'relationship',
      relationTo: 'contacts',
      admin: {
        description:
          'The go-to human for this membership. Used when the member is an organization — link the main contact person here.',
      },
      filterOptions: {
        type: { equals: 'person' },
      },
    },
    {
      name: 'membershipTier',
      type: 'relationship',
      relationTo: 'membership-tiers',
      admin: {
        description: 'The membership tier this member is subscribed to.',
      },
    },

    // Lifecycle
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Lapsed', value: 'lapsed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Reinstated', value: 'reinstated' },
      ],
      admin: {
        description:
          'Membership status. In production, transitions should go through MembershipService for audit logging.',
      },
    },
    {
      name: 'joinedDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
        description: 'Date the membership began.',
      },
    },
    {
      name: 'renewalDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
        description: 'Next renewal date for this membership.',
      },
    },

    // External system IDs
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        description: 'Stripe Customer ID for billing integration.',
        position: 'sidebar',
      },
    },
    {
      name: 'xeroContactId',
      type: 'text',
      admin: {
        description:
          'Xero Contact ID for accounting sync. Lives on the Member (the billable entity), not the Contact.',
        position: 'sidebar',
      },
    },

    // Internal notes
    {
      name: 'notes',
      type: 'richText',
      admin: {
        description: 'Internal notes about this membership. Not visible to the member.',
      },
    },
  ],
  hooks: {
    afterRead: [populateMemberTitle],
  },
  timestamps: true,
}
