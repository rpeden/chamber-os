import type { Block } from 'payload'

import { link } from '@/fields/link'
import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * News Feed block — pulls posts from the Posts collection and renders
 * them as cards with featured images, category badges, and titles.
 *
 * Used for: homepage "Latest News" section, category-filtered news
 * teasers, blog sidebar, or anywhere you want a dynamic post listing
 * embedded within a page's block layout.
 */
export const NewsFeed: Block = {
  slug: 'newsFeed',
  interfaceName: 'NewsFeedBlock',
  labels: {
    singular: 'News Feed',
    plural: 'News Feeds',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'introText',
      type: 'textarea',
      admin: {
        description: 'Optional short paragraph below the heading',
      },
    },
    {
      name: 'maxItems',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: {
        description: 'Maximum number of posts to display (1–12)',
      },
    },
    {
      name: 'categoryFilter',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description:
          'Optional: only show posts from these categories. Leave empty to show all categories.',
      },
    },
    {
      name: 'enableViewAllLink',
      type: 'checkbox',
      label: 'Show "View All" link',
      defaultValue: true,
    },
    link({
      appearances: false,
      overrides: {
        name: 'viewAllLink',
        label: 'View All Link',
        admin: {
          condition: (_data, siblingData) => Boolean(siblingData?.enableViewAllLink),
          description: 'Link to the full news/blog listing page',
        },
      },
    }),
    backgroundField,
  ],
}
