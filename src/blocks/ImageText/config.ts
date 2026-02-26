import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { backgroundField } from '@/fields/background'

/**
 * Image + Text block — image beside rich text content with optional CTA.
 *
 * Used for: "About us" sections, feature spotlights, testimonial-style layouts,
 * any content that pairs a visual with explanatory text.
 *
 * Layout flips between image-left and image-right. Stacks on mobile.
 */
export const ImageText: Block = {
  slug: 'imageText',
  interfaceName: 'ImageTextBlock',
  labels: {
    singular: 'Image + Text',
    plural: 'Image + Text Blocks',
  },
  fields: [
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'imageLeft',
      required: true,
      options: [
        { label: 'Image Left', value: 'imageLeft' },
        { label: 'Image Right', value: 'imageRight' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'enableCta',
      type: 'checkbox',
      label: 'Add a CTA button',
    },
    link({
      overrides: {
        admin: {
          condition: (_data, siblingData) => Boolean(siblingData?.enableCta),
        },
      },
    }),
    backgroundField,
  ],
}
