/**
 * Seed orchestrator for the Southern Hudson Bay Chamber of Commerce.
 *
 * This is the beating heart of the seed script — the one function that
 * clears the database, uploads all images, creates all content, and wires
 * everything together. It replaces the template's generic seed with
 * Chamber-specific content that actually makes sense.
 *
 * The order of operations matters:
 *   1. Clear everything (collections, globals, demo users)
 *   2. Upload all images (everything else depends on image IDs)
 *   3. Create categories (posts depend on category IDs)
 *   4. Create demo author (posts depend on author ID)
 *   5. Create posts sequentially (we want consistent ordering + related post linkage)
 *   6. Create events (independent of posts)
 *   7. Create team members (independent of posts/events)
 *   8. Create contact form + pages (homepage depends on nothing dynamic)
 *   9. Seed globals (header, footer, site-settings)
 *
 * Everything runs through the Payload Local API. No HTTP. No bullshit.
 */

import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest } from 'payload'

import { uploadAllSeedImages } from './chamber-images'
import { economicForecastPost, newBoardMemberPost, tradingPostSpotlight } from './chamber-posts'
import {
  businessAfterBearsEvent,
  lunchAndLearnEvent,
  awardsGalaEvent,
  firstFridayEvent,
} from './chamber-events'
import { boardPresident, boardVicePresident, boardTreasurer } from './chamber-team'
import { chamberHomepage } from './chamber-home'
import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'

/** Every collection we need to nuke before seeding. */
const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'events',
  'event-templates',
  'team',
  'forms',
  'form-submissions',
  'search',
]

/** Every global we need to reset. */
const globals: GlobalSlug[] = ['header', 'footer', 'site-settings']

const emptyGlobalData: Record<GlobalSlug, Record<string, unknown>> = {
  header: {
    utilityNav: [],
    navItems: [],
  },
  footer: {
    columns: [],
    copyright: '',
  },
  'site-settings': {},
}

/**
 * Nuke and reseed the entire database with Chamber content.
 *
 * This is called from the POST /next/seed API route.
 * Revalidation errors are expected when running without a dev server
 * (e.g., `pnpm seed`) — those are harmless and can be ignored.
 */
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding SHBCC database...')

  // ─── Step 1: Clear everything ──────────────────────────────────

  payload.logger.info('— Clearing collections and globals...')

  // Reset all globals to empty
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: emptyGlobalData[global],
        depth: 0,
        context: { disableRevalidate: true },
      }),
    ),
  )

  // Delete all documents from collections
  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  // Delete all version history too
  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection]?.config?.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  // Remove the demo author user if it exists from a previous seed
  await payload.delete({
    collection: 'users',
    depth: 0,
    where: { email: { equals: 'demo-author@shbcc.ca' } },
  })

  // ─── Step 2: Upload all images ─────────────────────────────────

  const images = await uploadAllSeedImages(payload)

  // ─── Step 3: Create categories ─────────────────────────────────

  payload.logger.info('— Creating categories...')

  const [chamberNewsCategory, economicDevCategory, memberSpotlightCategory] = await Promise.all([
    payload.create({
      collection: 'categories',
      data: { title: 'Chamber News', slug: 'chamber-news' },
    }),
    payload.create({
      collection: 'categories',
      data: { title: 'Economic Development', slug: 'economic-development' },
    }),
    payload.create({
      collection: 'categories',
      data: { title: 'Member Spotlight', slug: 'member-spotlight' },
    }),
  ])

  // ─── Step 4: Create demo author ────────────────────────────────

  payload.logger.info('— Creating demo author...')

  const demoAuthor = await payload.create({
    collection: 'users',
    data: {
      name: 'SHBCC Communications',
      email: 'demo-author@shbcc.ca',
      password: 'password',
    },
  })

  // ─── Step 5: Create posts (sequential for ordering) ────────────

  payload.logger.info('— Creating posts...')

  const post1Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: { disableRevalidate: true },
    data: economicForecastPost({
      heroImage: images['2026-economic-forecast.png'],
      author: demoAuthor,
      category: economicDevCategory,
    }),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: { disableRevalidate: true },
    data: newBoardMemberPost({
      heroImage: images['new-board-member.png'],
      author: demoAuthor,
      category: chamberNewsCategory,
    }),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: { disableRevalidate: true },
    data: tradingPostSpotlight({
      heroImage: images['hudson-bay-trading-post-hero.png'],
      author: demoAuthor,
      category: memberSpotlightCategory,
    }),
  })

  // Link related posts together
  payload.logger.info('— Linking related posts...')

  await Promise.all([
    payload.update({
      id: post1Doc.id,
      collection: 'posts',
      data: { relatedPosts: [post2Doc.id, post3Doc.id] },
    }),
    payload.update({
      id: post2Doc.id,
      collection: 'posts',
      data: { relatedPosts: [post1Doc.id, post3Doc.id] },
    }),
    payload.update({
      id: post3Doc.id,
      collection: 'posts',
      data: { relatedPosts: [post1Doc.id, post2Doc.id] },
    }),
  ])

  // ─── Step 6: Create events ─────────────────────────────────────

  payload.logger.info('— Creating events...')

  await Promise.all([
    payload.create({
      collection: 'events',
      depth: 0,
      context: { disableRevalidate: true },
      data: businessAfterBearsEvent({
        featuredImage: images['business_after_bears.png'],
      }),
    }),
    payload.create({
      collection: 'events',
      depth: 0,
      context: { disableRevalidate: true },
      data: lunchAndLearnEvent({
        featuredImage: images['lunch_and_learn.png'],
      }),
    }),
    payload.create({
      collection: 'events',
      depth: 0,
      context: { disableRevalidate: true },
      data: awardsGalaEvent({
        featuredImage: images['awards-gala.png'],
      }),
    }),
    payload.create({
      collection: 'events',
      depth: 0,
      context: { disableRevalidate: true },
      data: firstFridayEvent({
        featuredImage: images['first-friday-networking.png'],
      }),
    }),
  ])

  // ─── Step 7: Create team members ───────────────────────────────

  payload.logger.info('— Creating team members...')

  await Promise.all([
    payload.create({
      collection: 'team',
      depth: 0,
      data: boardPresident({ headshot: images['board-president.png'] }),
    }),
    payload.create({
      collection: 'team',
      depth: 0,
      data: boardVicePresident({ headshot: images['board-vice-president.png'] }),
    }),
    payload.create({
      collection: 'team',
      depth: 0,
      data: boardTreasurer({ headshot: images['board-treasurer.png'] }),
    }),
  ])

  // ─── Step 8: Create contact form + pages ───────────────────────

  payload.logger.info('— Creating pages...')

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData,
  })

  const [, _contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: chamberHomepage({
        heroImage: images['hero-image.png'],
        metaImage: images['hero-image.png'],
        testimonialPhotos: {
          human1: images['human-testimonial-1.png'],
          human2: images['human-testimonial-2.png'],
          seal: images['seal-testimonial.png'],
        },
        sponsorLogos: {
          logo1: images['s-logo-1.png'],
          logo2: images['s-logo-2.png'],
          logo3: images['s-logo-3.png'],
          logo4: images['s-logo-4.png'],
        },
      }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm }),
    }),
  ])

  // ─── Step 9: Seed globals ──────────────────────────────────────

  payload.logger.info('— Seeding header, footer, and site settings...')

  await Promise.all([
    // ── Header ──
    // Two-tier nav mirroring OBOT: utility nav on top, main nav below
    payload.updateGlobal({
      slug: 'header',
      data: {
        utilityNav: [
          {
            link: {
              type: 'custom' as const,
              label: 'Become a Member',
              url: '/membership',
            },
          },
          {
            link: {
              type: 'custom' as const,
              label: 'Member Login',
              url: '/login',
            },
          },
          {
            link: {
              type: 'custom' as const,
              label: 'Contact',
              url: '/contact',
            },
          },
        ],
        navItems: [
          // Membership dropdown
          {
            link: {
              type: 'custom' as const,
              label: 'Membership',
              url: '/membership',
            },
            children: [
              {
                link: {
                  type: 'custom' as const,
                  label: 'Join the Chamber',
                  url: '/membership',
                },
              },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Member Benefits',
                  url: '/membership/benefits',
                },
              },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Member Directory',
                  url: '/membership/directory',
                },
              },
            ],
          },
          // Events
          {
            link: {
              type: 'custom' as const,
              label: 'Events',
              url: '/events',
            },
            children: [
              {
                link: {
                  type: 'custom' as const,
                  label: 'Upcoming Events',
                  url: '/events',
                },
              },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Annual Gala',
                  url: '/events/annual-business-awards-gala',
                },
              },
            ],
          },
          // Advocacy
          {
            link: {
              type: 'custom' as const,
              label: 'Advocacy',
              url: '/advocacy',
            },
            children: [
              {
                link: {
                  type: 'custom' as const,
                  label: 'Policy Priorities',
                  url: '/advocacy/policy',
                },
              },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Economic Development',
                  url: '/advocacy/economic-development',
                },
              },
            ],
          },
          // About
          {
            link: {
              type: 'custom' as const,
              label: 'About',
              url: '/about',
            },
            children: [
              {
                link: {
                  type: 'custom' as const,
                  label: 'Our Team',
                  url: '/about/team',
                },
              },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Board of Directors',
                  url: '/about/board',
                },
              },
            ],
          },
          // News
          {
            link: {
              type: 'custom' as const,
              label: 'News',
              url: '/posts',
            },
          },
          // Contact (no dropdown)
          {
            link: {
              type: 'custom' as const,
              label: 'Contact',
              url: '/contact',
            },
          },
        ],
      },
    }),

    // ── Footer ──
    // Multi-column layout with grouped links
    payload.updateGlobal({
      slug: 'footer',
      data: {
        columns: [
          {
            heading: 'Quick Links',
            links: [
              { link: { type: 'custom' as const, label: 'Events', url: '/events' } },
              { link: { type: 'custom' as const, label: 'News', url: '/posts' } },
              { link: { type: 'custom' as const, label: 'Membership', url: '/membership' } },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Contact Us',
                  url: '/contact',
                },
              },
            ],
          },
          {
            heading: 'About',
            links: [
              { link: { type: 'custom' as const, label: 'Our Team', url: '/about/team' } },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Board of Directors',
                  url: '/about/board',
                },
              },
              { link: { type: 'custom' as const, label: 'Advocacy', url: '/advocacy' } },
            ],
          },
          {
            heading: 'Resources',
            links: [
              {
                link: {
                  type: 'custom' as const,
                  label: 'Member Directory',
                  url: '/membership/directory',
                },
              },
              {
                link: {
                  type: 'custom' as const,
                  label: 'Economic Reports',
                  url: '/resources/reports',
                },
              },
              {
                link: { type: 'custom' as const, label: 'Admin', url: '/admin' },
              },
            ],
          },
        ],
        copyright: '© {year} Southern Hudson Bay Chamber of Commerce. All rights reserved.',
      },
    }),

    // ── Site Settings ──
    payload.updateGlobal({
      slug: 'site-settings',
      data: {
        // Branding
        siteName: 'Southern Hudson Bay Chamber of Commerce',
        logo: images['chamber-logo.png'].id,
        tagline: 'Your Business. Your Community. Your North.',

        // Contact
        address: 'PO Box 309\nMoosonee, ON  P0L 1Y0\nCanada',
        phone: '(705) 336-2800',
        email: 'info@shbcc.ca',

        // Social Links
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/shbcc' },
          { platform: 'linkedin', url: 'https://linkedin.com/company/shbcc' },
          { platform: 'instagram', url: 'https://instagram.com/shbcc' },
        ],

        // Theme — northern palette: deep navy primary, spruce green secondary, gold accent
        primaryColor: '#1a3550',
        secondaryColor: '#2d5a3e',
        accentColor: '#d4a843',

        // Fonts — Montserrat for headings (loaded via next/font), Geist Sans for body
        headingFont: "var(--font-montserrat), 'Montserrat', sans-serif",
        bodyFont: "var(--font-montserrat), 'Montserrat', sans-serif",
      },
    }),
  ])

  payload.logger.info('Seeded SHBCC database successfully!')
}
