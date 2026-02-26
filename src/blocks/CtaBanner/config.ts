import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { backgroundField } from '@/fields/background'

/**
 * CTA Banner block — full-width call-to-action section.
 *
 * Used for: membership signup prompts, event registration nudges,
 * newsletter signups, any "big ask" that deserves visual prominence.
 *
 * Supports optional background image for extra impact.
 */
export const CtaBanner: Block = {
  slug: 'ctaBanner',
  interfaceName: 'CtaBannerBlock',
  labels: {
    singular: 'CTA Banner',
    plural: 'CTA Banners',
  },
  fields: [
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
    link({
      overrides: {
        name: 'link',
      },
    }),
    {
      name: 'ctaVariant',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Accent', value: 'accent' },
        { label: 'Outline', value: 'outline' },
      ],
      admin: {
        description: 'Visual style of the CTA button',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional background image — will display with a dark overlay for text readability',
      },
    },
    backgroundField,
  ],
}
