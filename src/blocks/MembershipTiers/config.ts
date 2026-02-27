import type { Block } from 'payload'

import { link } from '@/fields/link'
import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Membership Tiers block — displays pricing cards pulled from the
 * Membership Tiers collection.
 *
 * Fetches tiers at render time (server component), ordered by
 * `displayOrder`. Each card shows the tier name, price, feature list,
 * and an optional CTA link. One tier can be visually highlighted as
 * the recommended/popular option.
 */
export const MembershipTiersBlock: Block = {
  slug: 'membershipTiers',
  interfaceName: 'MembershipTiersBlock',
  labels: {
    singular: 'Membership Tiers',
    plural: 'Membership Tiers',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'introText',
      type: 'textarea',
      admin: {
        description: 'Optional intro paragraph displayed below the section heading.',
      },
    },
    {
      name: 'highlightedTier',
      type: 'relationship',
      relationTo: 'membership-tiers',
      admin: {
        description:
          'Optionally highlight one tier as "recommended" or "most popular". It will be visually emphasized.',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Get Started',
      admin: {
        description: 'Button text on each tier card (e.g., "Join Now", "Get Started").',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: 'CTA Destination',
        admin: {
          description:
            'Where the tier card buttons link to — e.g., a contact page, application form, or member portal.',
        },
      },
    }),
    backgroundField,
  ],
}
