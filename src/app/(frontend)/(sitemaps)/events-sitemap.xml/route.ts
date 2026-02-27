import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getEventsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    const results = await payload.find({
      collection: 'events',
      overrideAccess: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: {
        status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const dateFallback = new Date().toISOString()

    const sitemap = results.docs
      ? results.docs
          .filter((event) => Boolean(event?.slug))
          .map((event) => ({
            loc: `${SITE_URL}/events/${event?.slug}`,
            lastmod: event.updatedAt || dateFallback,
          }))
      : []

    return sitemap
  },
  ['events-sitemap'],
  {
    tags: ['events-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getEventsSitemap()

  return getServerSideSitemap(sitemap)
}
