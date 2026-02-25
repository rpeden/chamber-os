import type { RequiredDataFromCollectionSlug } from 'payload'

// Used for pre-seeded content so that the homepage is not empty
export const homeStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'minimal',
    heading: 'Chamber OS Website',
    subheading: 'Visit the admin dashboard to make your account and configure your site.',
  },
  meta: {
    description: 'An open-source website built with Chamber OS.',
    title: 'Chamber OS Website',
  },
  title: 'Home',
  layout: [],
}
