import type { Access, CollectionConfig } from 'payload'

import { currencyField } from '../../fields/currencyField'

const adminOrStaffOrAuthenticatedFallback: Access = ({ req: { user } }) => {
  if (!user) return false

  const roles = (user as { roles?: string[] }).roles

  // Transitional fallback: until roles are fully modeled in Users,
  // authenticated users can manage templates.
  if (!Array.isArray(roles)) return true

  return roles.includes('admin') || roles.includes('staff')
}

export const EventTemplates: CollectionConfig<'event-templates'> = {
  slug: 'event-templates',
  access: {
    create: adminOrStaffOrAuthenticatedFallback,
    delete: adminOrStaffOrAuthenticatedFallback,
    read: adminOrStaffOrAuthenticatedFallback,
    update: adminOrStaffOrAuthenticatedFallback,
  },
  admin: {
    group: 'Events',
    defaultColumns: ['seriesName', 'defaultLocation', 'defaultIsChambersEvent', 'updatedAt'],
    useAsTitle: 'seriesName',
  },
  fields: [
    {
      name: 'seriesName',
      type: 'text',
      required: true,
      admin: {
        description: 'A name for this recurring event series (e.g., "Monthly Luncheon", "AGM").',
      },
    },
    {
      name: 'defaultDescription',
      type: 'richText',
    },
    {
      name: 'defaultFeaturedImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'defaultLocation',
      type: 'text',
    },
    {
      name: 'defaultTicketingType',
      type: 'select',
      defaultValue: 'none',
      options: [
        {
          label: 'No Ticketing',
          value: 'none',
        },
        {
          label: 'External Ticket Link',
          value: 'external-link',
        },
        {
          label: 'Chamber Managed',
          value: 'chamber-managed',
        },
      ],
      required: true,
    },
    {
      name: 'defaultExternalTicketUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.defaultTicketingType === 'external-link',
      },
    },
    {
      name: 'defaultTicketTypes',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.defaultTicketingType === 'chamber-managed',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        currencyField({
          name: 'price',
          required: true,
          description: 'Default ticket price. Enter in dollars (stored in minor units internally).',
        }),
        {
          name: 'capacity',
          type: 'number',
          min: 1,
          required: true,
        },
        {
          name: 'saleStart',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'saleEnd',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'defaultServiceFee',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData.defaultTicketingType === 'chamber-managed',
        description: 'Default service fee applied to events created from this template.',
      },
      fields: [
        {
          name: 'feeType',
          type: 'select',
          defaultValue: 'none',
          options: [
            {
              label: 'None',
              value: 'none',
            },
            {
              label: 'Flat',
              value: 'flat',
            },
            {
              label: 'Percentage',
              value: 'percentage',
            },
          ],
          required: true,
        },
        {
          name: 'feeAmount',
          type: 'number',
          defaultValue: 0,
          min: 0,
        },
      ],
    },
    {
      name: 'defaultIsChambersEvent',
      type: 'checkbox',
      defaultValue: true,
      label: 'Default Is Chamber Event',
    },
  ],
}
