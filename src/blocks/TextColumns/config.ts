import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Text Columns block — 1–4 columns of rich text with configurable layout.
 *
 * Used for: about sections, service descriptions, feature breakdowns,
 * any content that benefits from side-by-side layout.
 */
export const TextColumns: Block = {
  slug: 'textColumns',
  interfaceName: 'TextColumnsBlock',
  labels: {
    singular: 'Text Columns',
    plural: 'Text Columns',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'twoEqual',
      required: true,
      options: [
        { label: '1 Column (Full Width)', value: 'oneColumn' },
        { label: '2 Columns (Equal)', value: 'twoEqual' },
        { label: '2 Columns (Wide Left)', value: 'twoWideLeft' },
        { label: '2 Columns (Wide Right)', value: 'twoWideRight' },
        { label: '3 Columns', value: 'threeEqual' },
        { label: '4 Columns', value: 'fourEqual' },
      ],
      admin: {
        description: 'Controls the column layout. On mobile, all layouts stack to a single column.',
      },
    },
    {
      name: 'columns',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Add up to 4 columns of rich text content',
      },
      fields: [
        {
          name: 'richText',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
            ],
          }),
          label: false,
        },
      ],
    },
    backgroundField,
  ],
}
