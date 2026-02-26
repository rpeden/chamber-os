import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Card Grid block — a grid of cards with image, heading, body, and optional CTA.
 *
 * Used for: service listings, team overview teasers, feature highlights,
 * benefit breakdowns — anything where you want uniform visual cards in a grid.
 */
export const CardGrid: Block = {
  slug: 'cardGrid',
  interfaceName: 'CardGridBlock',
  labels: {
    singular: 'Card Grid',
    plural: 'Card Grids',
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
      admin: {
        description: 'Number of columns on desktop. Stacks to fewer columns on smaller screens.',
      },
    },
    {
      name: 'cards',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      admin: {
        initCollapsed: true,
        description: 'Add cards to the grid',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Card image — displayed at the top of the card',
          },
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'body',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              FixedToolbarFeature(),
              InlineToolbarFeature(),
            ],
          }),
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
