import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { currencyField } from '../../fields/currencyField'

/**
 * Orders collection — event ticket purchases.
 *
 * Status transitions follow an explicit state machine (ADR-6):
 *   pending → confirmed → refunded
 *
 * In production, status is NOT directly editable in the admin UI —
 * transitions go through OrderService which enforces preconditions,
 * generates QR tokens, sends confirmation emails, and creates audit
 * log entries.
 *
 * For V0/beta, we allow admin edits but the field description
 * documents the intended workflow.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Purchase',
    plural: 'Purchases',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    group: 'Purchases',
    defaultColumns: [
      'purchaserName',
      'event',
      'ticketType',
      'quantity',
      'status',
      'createdAt',
    ],
  },
  fields: [
    // Purchaser info
    {
      name: 'purchaserName',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the person who made the purchase.',
      },
    },
    {
      name: 'purchaserEmail',
      type: 'email',
      required: true,
      admin: {
        description: 'Email for order confirmation and ticket delivery.',
      },
    },

    // Event & ticket
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'ticketType',
      type: 'text',
      required: true,
      admin: {
        description: 'The ticket type identifier (matches ticketTypes.name on the event).',
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
    },

    // Optional member link
    {
      name: 'contact',
      type: 'relationship',
      relationTo: 'contacts',
      admin: {
        description:
          'Optional link to a Contact record. Allows tracking purchase history for known contacts. Null for guest checkouts.',
      },
    },

    // Payment
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      index: true,
      admin: {
        description: 'Stripe Payment Intent ID. Indexed for idempotent webhook processing.',
        position: 'sidebar',
      },
    },
    currencyField({
      name: 'totalAmount',
      description: 'Total charged amount (ticket price × quantity + service fee + tax). Stored in minor units.',
    }),
    currencyField({
      name: 'serviceFeeAmount',
      description: 'Service fee amount, tracked separately for reporting. Stored in minor units.',
    }),
    currencyField({
      name: 'taxAmount',
      description: 'Tax amount charged (e.g., HST), tracked separately for reporting. Stored in minor units.',
    }),

    // State machine
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: {
        description:
          'Order status. Follows the state machine: pending → confirmed → refunded. In production, transitions go through OrderService (ADR-6).',
      },
    },

    // QR token for ticket validation
    {
      name: 'qrToken',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description:
          'Auto-generated token for QR code ticket validation. Created when order is confirmed.',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
