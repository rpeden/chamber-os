import type { Block } from 'payload'

import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Sponsors Grid block — tiered logo grid with optional carousel mode.
 *
 * Used for: homepage sponsor showcase, event sponsor acknowledgment,
 * partnership page, or anywhere you need to display a collection of
 * logos organized by sponsorship tier.
 *
 * Each tier has its own heading, display mode (static grid or carousel),
 * and array of logos linked to sponsor URLs. Logos are rendered at
 * uniform height with preserved aspect ratio.
 */
export const SponsorsGrid: Block = {
  slug: 'sponsorsGrid',
  interfaceName: 'SponsorsGridBlock',
  labels: {
    singular: 'Sponsors Grid',
    plural: 'Sponsors Grids',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'tiers',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Add sponsor tiers — e.g., "Pillar Partners", "Gold Sponsors"',
      },
      fields: [
        {
          name: 'tierName',
          type: 'text',
          required: true,
          admin: {
            description: 'Heading shown above this row of logos',
          },
        },
        {
          name: 'displayMode',
          type: 'select',
          defaultValue: 'grid',
          required: true,
          options: [
            { label: 'Grid (all visible)', value: 'grid' },
            { label: 'Carousel (prev/next)', value: 'carousel' },
          ],
          admin: {
            description:
              'Grid shows all logos at once. Carousel lets you scroll through them with arrows.',
          },
        },
        {
          name: 'logos',
          type: 'array',
          minRows: 1,
          maxRows: 20,
          admin: {
            description: 'Add sponsor logos with optional links to their websites',
          },
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'sponsorName',
              type: 'text',
              admin: {
                description: 'Used for alt text and hover tooltip',
              },
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                description: "Link to the sponsor's website (opens in new tab)",
              },
            },
          ],
        },
      ],
    },
    backgroundField,
  ],
}
