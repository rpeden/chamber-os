import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

/**
 * Header global — two-row navigation structure.
 *
 * Row 1 (utility nav): Small top bar with quick links (e.g., "Member Login",
 *   "Contact") and social icons pulled from site-settings.
 *
 * Row 2 (main nav): Logo + primary navigation with dropdown support.
 *   Each nav item can optionally have child links that appear in a dropdown.
 */
export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    // ── Utility Nav (top bar) ──
    {
      name: 'utilityNav',
      type: 'array',
      label: 'Utility Navigation',
      maxRows: 5,
      admin: {
        description:
          'Small links shown in the top bar (e.g., "Become a Member", "Member Login", "Contact"). Social icons are pulled automatically from Site Settings.',
        initCollapsed: true,
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
    },

    // ── Main Nav (primary navigation with dropdowns) ──
    {
      name: 'navItems',
      type: 'array',
      label: 'Main Navigation',
      maxRows: 8,
      admin: {
        description: 'Primary site navigation. Each item can optionally have dropdown child links.',
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        link({
          appearances: false,
        }),
        {
          name: 'children',
          type: 'array',
          label: 'Dropdown Links',
          maxRows: 10,
          admin: {
            description: 'Optional child links shown in a dropdown menu under this item.',
            initCollapsed: true,
          },
          fields: [
            link({
              appearances: false,
            }),
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
