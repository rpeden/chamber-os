import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

/**
 * Cached fetch of the site-settings global.
 *
 * Returns the full settings document, cached and tagged so it
 * revalidates when the admin saves changes. Use this wherever
 * you need site branding, contact info, or social links in
 * Server Components.
 */
export const getSiteSettings = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    return payload.findGlobal({
      slug: 'site-settings',
    })
  },
  ['site-settings'],
  {
    tags: ['site-settings'],
  },
)
