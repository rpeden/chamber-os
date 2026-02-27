import type { Access, CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

const authenticatedOrPublishedTeam: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    status: {
      equals: 'published',
    },
  }
}

export const Team: CollectionConfig<'team'> = {
  slug: 'team',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublishedTeam,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
    defaultColumns: ['name', 'title', 'type', 'status', 'displayOrder'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'richText',
    },
    {
      name: 'headshot',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'staff',
      options: [
        {
          label: 'Staff',
          value: 'staff',
        },
        {
          label: 'Board',
          value: 'board',
        },
      ],
      required: true,
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      required: true,
      admin: {
        description: 'Lower numbers appear first. Use this to control the order staff and board members are shown.',
      },
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'linkedin',
      type: 'text',
      admin: {
        description: 'Full LinkedIn profile URL (e.g., https://linkedin.com/in/janedoe).',
      },
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
      ],
      required: true,
    },
  ],
}
