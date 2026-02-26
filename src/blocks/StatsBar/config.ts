import type { Block } from 'payload'

import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Stats Bar block — a horizontal row of big numbers with labels.
 *
 * Used for: membership stats ("500+ Members"), impact numbers,
 * event attendance figures, "by the numbers" sections.
 *
 * The `number` field is a text field, not a number type, because
 * people want to write "500+", "$2M", "25 Years", etc.
 * Trying to format a literal numeric value into these display strings
 * is a waste of everyone's time.
 */
export const StatsBar: Block = {
  slug: 'statsBar',
  interfaceName: 'StatsBarBlock',
  labels: {
    singular: 'Stats Bar',
    plural: 'Stats Bars',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'stats',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      admin: {
        initCollapsed: false,
        description: 'Add 2–6 statistics to display in a row',
      },
      fields: [
        {
          name: 'number',
          type: 'text',
          required: true,
          admin: {
            description: 'The stat value — e.g., "500+", "$2M", "25 Years"',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Label below the number — e.g., "Active Members", "Raised Annually"',
          },
        },
      ],
    },
    backgroundField,
  ],
}
