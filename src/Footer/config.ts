import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

/**
 * Footer global — multi-column layout with grouped links.
 *
 * Each "column" has a heading and a set of links rendered underneath.
 * Contact info and social links are pulled from site-settings automatically.
 * The copyright text supports a {year} placeholder for auto-updating.
 */
export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Footer Columns',
      maxRows: 4,
      admin: {
        description:
          'Organize footer links into columns with headings. Contact info and social links appear automatically from Site Settings.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
          admin: {
            description: 'Column heading (e.g., "Quick Links", "Resources", "Events")',
          },
        },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          maxRows: 8,
          fields: [
            link({
              appearances: false,
            }),
          ],
          admin: {
            initCollapsed: true,
          },
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      defaultValue: '© {year} Chamber of Commerce. All rights reserved.',
      admin: {
        description:
          'Copyright text shown at the bottom of the footer. Use {year} and it will be replaced with the current year automatically.',
      },
    },
    // Keep the old navItems for backward compat during migration
    {
      name: 'navItems',
      type: 'array',
      label: 'Legacy Nav Items',
      admin: {
        description: 'Legacy flat nav links. Use Footer Columns instead.',
        condition: () => false, // Hidden in admin
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
