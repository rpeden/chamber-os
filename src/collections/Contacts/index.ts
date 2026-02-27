import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

/**
 * Contacts collection — the CRM backbone.
 *
 * A Contact is any person or organization the Chamber has reason to track:
 * members, mayors, event speakers, venue contacts, vendors, sponsors, media,
 * prospects. A Contact can exist without ever becoming a Member.
 *
 * See ADR-2: Contacts and Members are separate concepts.
 */
export const Contacts: CollectionConfig = {
  slug: 'contacts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated, // Future: public read limited fields for directory
    update: authenticated,
  },
  admin: {
    group: 'Members & Contacts',
    defaultColumns: ['name', 'email', 'type', 'organization', 'createdAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the person, or the organization name.',
      },
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'person',
      options: [
        { label: 'Person', value: 'person' },
        { label: 'Organization', value: 'organization' },
      ],
      admin: {
        description:
          'Is this contact a person or an organization? Members can be either type.',
      },
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'contacts',
      admin: {
        description:
          'If this person belongs to an organization, link the org Contact here.',
        condition: (data) => data.type === 'person',
      },
      filterOptions: {
        type: { equals: 'organization' },
      },
    },
    // Address group
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text' },
            { name: 'province', type: 'text', defaultValue: 'ON' },
            { name: 'postalCode', type: 'text' },
          ],
        },
      ],
    },
    // Tags
    {
      name: 'tags',
      type: 'array',
      admin: {
        description:
          'Flexible tags for categorizing contacts (e.g., vendor, municipal, media, prospect).',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    // Social & web
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Full URL including https://',
      },
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'x', type: 'text', label: 'X (Twitter)' },
      ],
    },
    // Notes
    {
      name: 'notes',
      type: 'richText',
      admin: {
        description: 'Internal notes about this contact. Not shown publicly.',
      },
    },
  ],
  timestamps: true,
}
