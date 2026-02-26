import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Mixed Content Row block — a flexible row of 1–4 slots with configurable widths and content types.
 *
 * This is the "escape hatch" block for layouts that don't fit neatly into
 * text-columns, card-grid, or image-text. Each slot independently chooses
 * its width fraction and content type.
 *
 * Used for: mixed media layouts, sidebar + main content, complex hero-like
 * mid-page sections, anything that needs asymmetric column configurations
 * with heterogeneous content.
 *
 * Deliberate constraint: max 4 slots. If someone needs more than 4 columns,
 * they need a different design, not a more complicated block.
 */
export const MixedContentRow: Block = {
  slug: 'mixedContentRow',
  interfaceName: 'MixedContentRowBlock',
  labels: {
    singular: 'Mixed Content Row',
    plural: 'Mixed Content Rows',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'verticalAlignment',
      type: 'select',
      defaultValue: 'top',
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'bottom' },
      ],
      admin: {
        description: 'Vertical alignment of slot contents when heights differ',
      },
    },
    {
      name: 'slots',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Add 1–4 content slots. Column widths should add up to a sensible total.',
      },
      fields: [
        {
          name: 'width',
          type: 'select',
          defaultValue: 'half',
          required: true,
          options: [
            { label: '1/4 Width', value: 'quarter' },
            { label: '1/3 Width', value: 'third' },
            { label: '1/2 Width', value: 'half' },
            { label: '2/3 Width', value: 'twoThirds' },
            { label: '3/4 Width', value: 'threeQuarters' },
            { label: 'Full Width', value: 'full' },
          ],
        },
        {
          name: 'contentType',
          type: 'select',
          defaultValue: 'richText',
          required: true,
          options: [
            { label: 'Rich Text', value: 'richText' },
            { label: 'Image', value: 'image' },
            { label: 'CTA Card', value: 'cta' },
          ],
        },
        // Rich text content
        {
          name: 'richText',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
            ],
          }),
          admin: {
            condition: (_data, siblingData) => siblingData?.contentType === 'richText',
          },
        },
        // Image content
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_data, siblingData) => siblingData?.contentType === 'image',
          },
        },
        // CTA content
        {
          name: 'ctaHeading',
          type: 'text',
          admin: {
            condition: (_data, siblingData) => siblingData?.contentType === 'cta',
          },
        },
        {
          name: 'ctaBody',
          type: 'textarea',
          admin: {
            condition: (_data, siblingData) => siblingData?.contentType === 'cta',
          },
        },
        link({
          overrides: {
            admin: {
              condition: (_data, siblingData) => siblingData?.contentType === 'cta',
            },
          },
        }),
      ],
    },
    backgroundField,
  ],
}
