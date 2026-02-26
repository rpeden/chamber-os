import type { Block } from 'payload'

import { link } from '@/fields/link'
import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Icon Grid block — a grid of icon + overline + heading + body items.
 *
 * Used for: "Why join us" sections, service categories, value propositions,
 * benefit breakdowns with visual icons.
 *
 * Icons are uploaded images (SVG recommended) rather than an icon picker,
 * because icon picker components are a maintenance nightmare and every Chamber
 * will want different icons anyway. Upload your own damn icons.
 */
export const IconGrid: Block = {
  slug: 'iconGrid',
  interfaceName: 'IconGridBlock',
  labels: {
    singular: 'Icon Grid',
    plural: 'Icon Grids',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      required: true,
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 2,
      maxRows: 12,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Icon image — SVG recommended, displayed at 48×48px',
          },
        },
        {
          name: 'overline',
          type: 'text',
          admin: {
            description: 'Small text above the heading (e.g., "Step 1", "Networking")',
          },
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
          admin: {
            description: 'Short description — plain text, not rich text',
          },
        },
        {
          name: 'enableLink',
          type: 'checkbox',
          label: 'Add a link',
        },
        link({
          appearances: false,
          overrides: {
            admin: {
              condition: (_data, siblingData) => Boolean(siblingData?.enableLink),
            },
          },
        }),
      ],
    },
    backgroundField,
  ],
}
