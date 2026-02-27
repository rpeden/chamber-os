import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'
import { currencyField } from '../../fields/currencyField'

/**
 * Membership Tiers collection — defines the tiers a Chamber offers.
 *
 * Examples: Bronze, Silver, Gold, Platinum. Each tier has a name,
 * annual price, feature list, and optional Stripe Price ID for
 * automated billing integration.
 */
export const MembershipTiers: CollectionConfig = {
  slug: 'membership-tiers',
  labels: {
    singular: 'Membership Tier',
    plural: 'Membership Tiers',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone, // Public — displayed on pricing pages
    update: authenticated,
  },
  admin: {
    group: 'Members & Contacts',
    defaultColumns: ['name', 'annualPrice', 'displayOrder'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Tier name shown publicly (e.g., "Gold", "Platinum").',
      },
    },
    currencyField({
      name: 'annualPrice',
      required: true,
      description: 'Annual membership price. Enter in dollars (stored in minor units internally).',
    }),
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Detailed tier description for the public-facing pricing page.',
      },
    },
    {
      name: 'features',
      type: 'array',
      admin: {
        description: 'List of features/benefits included in this tier.',
      },
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Controls the order tiers appear on the pricing page. Lower numbers appear first.',
      },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        description:
          'Stripe Price ID for automated billing. Leave blank until Stripe integration is configured.',
      },
    },
  ],
  timestamps: true,
}
