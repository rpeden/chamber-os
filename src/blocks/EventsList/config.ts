import type { Block } from 'payload'

import { link } from '@/fields/link'
import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Events List block — pulls events from the Events collection and renders
 * them as visually prominent cards with date badges and image backgrounds.
 *
 * Used for: homepage "Upcoming Events" section, sidebar event teasers,
 * event landing page featured section, or anywhere you want a curated
 * or filtered event listing embedded in a page.
 *
 * Display modes:
 * - `featured`: only events with isFeatured=true
 * - `upcoming`: future events sorted by start date
 * - `all`: everything published, newest first
 */
export const EventsList: Block = {
  slug: 'eventsList',
  interfaceName: 'EventsListBlock',
  labels: {
    singular: 'Events List',
    plural: 'Events Lists',
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
      name: 'displayMode',
      type: 'select',
      defaultValue: 'upcoming',
      required: true,
      options: [
        { label: 'Featured Events', value: 'featured' },
        { label: 'Upcoming Events', value: 'upcoming' },
        { label: 'All Events', value: 'all' },
      ],
      admin: {
        description:
          'Featured: only events marked as featured. Upcoming: future events by date. All: everything published.',
      },
    },
    {
      name: 'maxItems',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: {
        description: 'Maximum number of events to display (1–12)',
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
          description: 'Link to the full events listing page',
        },
      },
    }),
    backgroundField,
  ],
}
