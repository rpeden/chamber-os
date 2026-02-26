import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { revalidateEvent, revalidateEventDelete } from './hooks/revalidateEvent'
import { slugField } from 'payload'

const authenticatedOrPublishedEvent: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    status: {
      equals: 'published',
    },
  }
}

const applyEventTemplateDefaults: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (!data || operation !== 'create') return data

  const templateRef = data.eventTemplate
  const templateID =
    typeof templateRef === 'string'
      ? templateRef
      : typeof templateRef === 'object' && templateRef && 'id' in templateRef
        ? templateRef.id
        : undefined

  if (!templateID) return data

  const template = await req.payload.findByID({
    collection: 'event-templates',
    id: templateID,
    depth: 0,
    overrideAccess: false,
    req,
  })

  if (!template) return data

  if (!data.description && template.defaultDescription) {
    data.description = template.defaultDescription
  }

  if (!data.featuredImage && template.defaultFeaturedImage) {
    data.featuredImage =
      typeof template.defaultFeaturedImage === 'object'
        ? template.defaultFeaturedImage.id
        : template.defaultFeaturedImage
  }

  if (!data.location && template.defaultLocation) {
    data.location = template.defaultLocation
  }

  if (!data.ticketingType && template.defaultTicketingType) {
    data.ticketingType = template.defaultTicketingType
  }

  if (!data.externalTicketUrl && template.defaultExternalTicketUrl) {
    data.externalTicketUrl = template.defaultExternalTicketUrl
  }

  if ((!data.ticketTypes || data.ticketTypes.length === 0) && template.defaultTicketTypes) {
    data.ticketTypes = template.defaultTicketTypes.map((ticketType) => ({
      capacity: ticketType.capacity,
      description: ticketType.description,
      name: ticketType.name,
      priceCents: ticketType.priceCents,
      saleEnd: ticketType.saleEnd,
      saleStart: ticketType.saleStart,
    }))
  }

  if (!data.serviceFee && template.defaultServiceFee) {
    data.serviceFee = {
      feeAmount: template.defaultServiceFee.feeAmount,
      feeType: template.defaultServiceFee.feeType,
    }
  }

  if (
    typeof data.isChambersEvent !== 'boolean' &&
    typeof template.defaultIsChambersEvent === 'boolean'
  ) {
    data.isChambersEvent = template.defaultIsChambersEvent
  }

  return data
}

export const Events: CollectionConfig<'events'> = {
  slug: 'events',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublishedEvent,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'startDate', 'status', 'ticketingType', 'isChambersEvent'],
    useAsTitle: 'title',
  },
  defaultPopulate: {
    title: true,
    slug: true,
    startDate: true,
    endDate: true,
    location: true,
    featuredImage: true,
    status: true,
    isChambersEvent: true,
    isFeatured: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'eventTemplate',
      type: 'relationship',
      relationTo: 'event-templates',
      admin: {
        description:
          'Optional: choose a template to prefill ticketing, location, and other defaults on create.',
      },
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'startDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      required: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'isChambersEvent',
      type: 'checkbox',
      defaultValue: true,
      label: 'Is Chamber Event',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
      ],
      required: true,
    },
    {
      name: 'ticketingType',
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
      name: 'externalTicketUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.ticketingType === 'external-link',
        description: 'Use when ticket sales are handled on another platform.',
      },
    },
    {
      name: 'ticketTypes',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.ticketingType === 'chamber-managed',
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
        {
          name: 'priceCents',
          type: 'number',
          min: 0,
          required: true,
        },
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
      name: 'serviceFee',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData.ticketingType === 'chamber-managed',
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
    slugField(),
  ],
  hooks: {
    beforeValidate: [applyEventTemplateDefaults],
    afterChange: [revalidateEvent],
    afterDelete: [revalidateEventDelete],
  },
}
