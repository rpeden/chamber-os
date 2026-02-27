import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

/**
 * AuditLog collection — append-only log for critical transitions.
 *
 * See ADR-7: All critical state transitions get an explicit audit log entry.
 * Writes go through AuditService — never directly.
 *
 * Logged events include:
 * - Member status changes (pending → active, active → lapsed, etc.)
 * - Order status changes (pending → confirmed → refunded)
 * - Payment events (intent created, succeeded, failed, refunded)
 * - Membership tier changes
 * - Manual overrides by staff
 */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: {
    singular: 'Audit Log Entry',
    plural: 'Audit Log',
  },
  access: {
    // Append-only: admin can read + create, no update or delete
    create: authenticated,
    read: authenticated,
    update: () => false,
    delete: () => false,
  },
  admin: {
    group: 'Settings',
    defaultColumns: ['entityType', 'action', 'entityId', 'actorType', 'createdAt'],
  },
  fields: [
    {
      name: 'entityType',
      type: 'select',
      required: true,
      options: [
        { label: 'Member', value: 'member' },
        { label: 'Order', value: 'order' },
        { label: 'Payment', value: 'payment' },
        { label: 'Contact', value: 'contact' },
      ],
    },
    {
      name: 'entityId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID of the entity this log entry relates to.',
      },
    },
    {
      name: 'action',
      type: 'text',
      required: true,
      admin: {
        description:
          'What happened — e.g., "status_changed", "tier_upgraded", "payment_succeeded".',
      },
    },
    {
      name: 'fromState',
      type: 'text',
      admin: {
        description: 'Previous state (if applicable).',
      },
    },
    {
      name: 'toState',
      type: 'text',
      admin: {
        description: 'New state (if applicable).',
      },
    },
    {
      name: 'actorId',
      type: 'text',
      admin: {
        description:
          'Who triggered this — staff user ID, Contact ID, "system", or "webhook".',
      },
    },
    {
      name: 'actorType',
      type: 'select',
      required: true,
      options: [
        { label: 'Staff', value: 'staff' },
        { label: 'Member', value: 'member' },
        { label: 'System', value: 'system' },
        { label: 'Webhook', value: 'webhook' },
      ],
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional context as JSON (e.g., reason for override, payment details).',
      },
    },
  ],
  timestamps: true,
}
