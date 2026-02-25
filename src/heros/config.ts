import type { Field } from 'payload'

import { link } from '@/fields/link'

/**
 * Hero field configuration for Pages.
 *
 * Three modes:
 * - **none**: No hero. Just jump straight into the content.
 * - **minimal**: A simple heading + optional subheading on a clean background.
 *   For interior pages that don't need the drama.
 * - **fullBleed**: Full-viewport background image with gradient overlay,
 *   centered heading/subheading, and 1-3 CTA buttons. The OBOT-style
 *   homepage hero.
 *
 * Uses plain text fields for heading/subheading instead of Lexical rich text
 * because a hero heading is a sentence, not a document. Loading the entire
 * Lexical editor for an h1 is like hiring a moving truck to carry a sandwich.
 */
export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'none',
      label: 'Hero Style',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Full Bleed', value: 'fullBleed' },
      ],
      required: true,
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        condition: (_, { type } = {}) => type !== 'none',
        description: 'The main heading displayed in the hero area.',
      },
    },
    {
      name: 'subheading',
      type: 'text',
      admin: {
        condition: (_, { type } = {}) => type !== 'none',
        description: 'Optional secondary text below the heading.',
      },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        condition: (_, { type } = {}) => type === 'fullBleed',
        description: 'Background image for the hero. Use a high-resolution landscape image.',
      },
    },
    {
      name: 'overlayOpacity',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 50,
      admin: {
        condition: (_, { type } = {}) => type === 'fullBleed',
        description:
          'How dark the gradient overlay should be (0 = fully transparent, 100 = fully opaque). Default 50.',
        step: 5,
      },
    },
    {
      name: 'ctaButtons',
      type: 'array',
      label: 'CTA Buttons',
      minRows: 0,
      maxRows: 3,
      admin: {
        condition: (_, { type } = {}) => type === 'fullBleed',
        description: 'Up to 3 call-to-action buttons displayed below the heading.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'primary',
          label: 'Button Color',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Accent', value: 'accent' },
            { label: 'Outline (White)', value: 'outline' },
          ],
          required: true,
        },
        link({
          appearances: false,
        }),
      ],
    },
  ],
  label: false,
}
