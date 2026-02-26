import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { backgroundField } from '@/fields/background'

/**
 * Testimonials block — a carousel of member/partner quotes with
 * pullquote, full quote, attribution, and optional photo.
 *
 * Used for: homepage social proof, membership benefits page,
 * event recap pages, or anywhere you want real voices from the community.
 *
 * Renders as a client component for carousel interaction (prev/next buttons,
 * optional auto-advance). Each testimonial shows the pullquote prominently
 * on one side with the full quote and attribution on the other.
 */
export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: {
    singular: 'Testimonials',
    plural: 'Testimonials',
  },
  fields: [
    {
      name: 'sectionHeading',
      type: 'text',
      admin: {
        description: 'Optional heading above the testimonials carousel',
      },
    },
    {
      name: 'testimonials',
      type: 'array',
      minRows: 1,
      maxRows: 10,
      admin: {
        initCollapsed: true,
        description: 'Add testimonials — each one appears as a slide in the carousel',
      },
      fields: [
        {
          name: 'pullquote',
          type: 'text',
          required: true,
          admin: {
            description:
              'A short, punchy excerpt displayed large — the "headline" of the testimonial',
          },
        },
        {
          name: 'fullQuote',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              FixedToolbarFeature(),
              InlineToolbarFeature(),
            ],
          }),
          admin: {
            description: 'The complete testimonial text',
          },
        },
        {
          name: 'attributionName',
          type: 'text',
          required: true,
          admin: {
            description: 'Name of the person giving the testimonial',
          },
        },
        {
          name: 'attributionOrg',
          type: 'text',
          admin: {
            description: 'Organization, title, or role — e.g., "Owner, Hudson Bay Trading Post"',
          },
        },
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional headshot photo',
          },
        },
      ],
    },
    {
      name: 'autoAdvance',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Automatically cycle through testimonials every 8 seconds',
      },
    },
    backgroundField,
  ],
}
