import type { GlobalConfig } from 'payload'

import { FONT_OPTIONS } from '@/lib/theme'
import { revalidateTag } from 'next/cache'
import type { PayloadRequest } from 'payload'

/**
 * Site Settings global — the single source of truth for site-wide
 * configuration: branding, contact info, social links, and theme.
 *
 * These values are cached in memory and injected as CSS custom
 * properties into every page. The cache is busted on save via
 * the afterChange hook.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Manage your site branding, contact information, social links, and theme colors.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      async ({ req }: { req: PayloadRequest }) => {
        // Bust the Next.js cache so the theme CSS re-renders
        revalidateTag('site-settings')
        req.payload.logger.info('Site settings updated — cache revalidated')
      },
    ],
  },
  fields: [
    // ──────────────────────────────────────────
    // Tab: Branding
    // ──────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Branding',
          description: 'Logo, site name, and tagline',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
              defaultValue: 'Chamber of Commerce',
              admin: {
                description: 'Displayed in the browser tab and fallback header text.',
              },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Main site logo. Recommended: SVG or transparent PNG, at least 200px wide.',
              },
            },
            {
              name: 'tagline',
              type: 'text',
              admin: {
                description: 'A short tagline shown below the logo or in the hero area.',
              },
            },
          ],
        },

        // ──────────────────────────────────────────
        // Tab: Contact
        // ──────────────────────────────────────────
        {
          label: 'Contact Information',
          description: 'Address, phone, and email displayed in the footer and contact pages.',
          fields: [
            {
              name: 'address',
              type: 'textarea',
              admin: {
                description: 'Full mailing address. Line breaks are preserved.',
              },
            },
            {
              name: 'phone',
              type: 'text',
              admin: {
                description: 'Main phone number (displayed as-is).',
              },
            },
            {
              name: 'email',
              type: 'email',
              admin: {
                description: 'General contact email address.',
              },
            },
          ],
        },

        // ──────────────────────────────────────────
        // Tab: Social Links
        // ──────────────────────────────────────────
        {
          label: 'Social Links',
          description: 'Social media profiles shown in the header and footer.',
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              label: 'Social Links',
              maxRows: 8,
              admin: {
                description: 'Add links to your social media profiles.',
              },
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Twitter / X', value: 'twitter' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'TikTok', value: 'tiktok' },
                  ],
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Full URL (e.g., https://facebook.com/yourchamber)',
                  },
                },
              ],
            },
          ],
        },

        // ──────────────────────────────────────────
        // Tab: Theme
        // ──────────────────────────────────────────
        {
          label: 'Theme',
          description: 'Colors and fonts that control how your site looks.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'primaryColor',
                  type: 'text',
                  required: true,
                  defaultValue: '#1e3a5f',
                  admin: {
                    description: 'Main brand color (hex). Used for headers, buttons, and accents.',
                    width: '33%',
                  },
                },
                {
                  name: 'secondaryColor',
                  type: 'text',
                  required: true,
                  defaultValue: '#2d5f8a',
                  admin: {
                    description:
                      'Secondary brand color (hex). Used for hover states and backgrounds.',
                    width: '33%',
                  },
                },
                {
                  name: 'accentColor',
                  type: 'text',
                  required: true,
                  defaultValue: '#e8a317',
                  admin: {
                    description:
                      'Accent color (hex). Used for highlights and call-to-action buttons.',
                    width: '33%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'headingFont',
                  type: 'select',
                  required: true,
                  defaultValue: 'system-ui, -apple-system, sans-serif',
                  options: FONT_OPTIONS.map(({ label, value }) => ({ label, value })),
                  admin: {
                    description: 'Font family for headings (h1–h6).',
                    width: '50%',
                  },
                },
                {
                  name: 'bodyFont',
                  type: 'select',
                  required: true,
                  defaultValue: 'system-ui, -apple-system, sans-serif',
                  options: FONT_OPTIONS.map(({ label, value }) => ({ label, value })),
                  admin: {
                    description: 'Font family for body text.',
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },

        // ──────────────────────────────────────────
        // Tab: Analytics (Phase 13)
        // ──────────────────────────────────────────
        {
          label: 'Analytics',
          description: 'Third-party analytics integration.',
          fields: [
            {
              name: 'gaId',
              type: 'text',
              label: 'Google Analytics ID',
              admin: {
                description:
                  'Google Analytics 4 measurement ID (e.g., G-XXXXXXXXXX). Leave empty to disable.',
              },
            },
            {
              name: 'gtmId',
              type: 'text',
              label: 'Google Tag Manager ID',
              admin: {
                description: 'GTM container ID (e.g., GTM-XXXXXXX). Leave empty to disable.',
              },
            },
            {
              name: 'customHeadScripts',
              type: 'code',
              label: 'Custom Head Scripts',
              admin: {
                language: 'html',
                description:
                  'Custom HTML/scripts injected into <head>. Use for third-party tracking pixels, meta tags, etc. Be careful — bad scripts can break the site.',
              },
            },
          ],
        },
      ],
    },
  ],
}
