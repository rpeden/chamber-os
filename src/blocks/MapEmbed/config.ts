import type { Block } from 'payload'

import { backgroundField, sectionHeadingField } from '@/fields/background'

/**
 * Map Embed block for location/directions sections.
 */
export const MapEmbed: Block = {
  slug: 'mapEmbed',
  interfaceName: 'MapEmbedBlock',
  labels: {
    singular: 'Map Embed',
    plural: 'Map Embeds',
  },
  fields: [
    sectionHeadingField,
    {
      name: 'address',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Address shown above/alongside the map.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'latitude',
          type: 'number',
          required: true,
          admin: {
            width: '33%',
            description: 'Latitude coordinate.',
          },
        },
        {
          name: 'longitude',
          type: 'number',
          required: true,
          admin: {
            width: '33%',
            description: 'Longitude coordinate.',
          },
        },
        {
          name: 'zoom',
          type: 'number',
          required: true,
          defaultValue: 14,
          min: 1,
          max: 20,
          admin: {
            width: '33%',
            description: 'Map zoom level (1-20).',
          },
        },
      ],
    },
    {
      name: 'overlayText',
      type: 'textarea',
      admin: {
        description: 'Optional short text shown beside the map (hours, directions, parking notes).',
      },
    },
    {
      name: 'height',
      type: 'select',
      defaultValue: '420',
      options: [
        { label: 'Compact (320px)', value: '320' },
        { label: 'Standard (420px)', value: '420' },
        { label: 'Tall (520px)', value: '520' },
      ],
    },
    backgroundField,
  ],
}
