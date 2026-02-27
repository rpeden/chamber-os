import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

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
  admin: {
    group: 'Members & Contacts',
    defaultColumns: ['contact', 'membershipTier', 'status', 'renewalDate', 'joinedDate'],
    useAsTitle: 'contact',
  },
  fields: [
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
  timestamps: true,
}
