/**
 * Seed orchestrator for the Southern Georgian Bay Chamber of Commerce.
 *
 * Same structure as the SHBCC seed, different bird, different bay.
 * Clears the DB, uploads images, creates everything from posts to
 * membership tiers, then wires up globals.
 *
 * The order of operations is gospel:
 *   1. Clear everything (collections, globals, demo users)
 *   2. Upload all images (everything else depends on image IDs)
 *   3. Create categories (posts depend on category IDs)
 *   4. Create demo author (posts depend on author ID)
 *   5. Create posts sequentially (consistent ordering + related post linkage)
 *   6. Create events
 *   7. Create team members
 *   8. Create membership tiers, contacts, members
 *   9. Create contact form + pages (homepage, contact)
 *  10. Seed globals (header, footer, site-settings)
 */

import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest } from 'payload'

import { uploadAllSeedImages } from './chamber-images'
import { economicForecastPost, newBoardMemberPost, memberSpotlight } from './chamber-posts'
import {
  businessAfterHoursEvent,
  lunchAndLearnEvent,
  awardsGalaEvent,
  firstFridayEvent,
} from './chamber-events'
import { boardPresident, boardVicePresident, boardTreasurer } from './chamber-team'
import { chamberHomepage } from './chamber-home'
import { contactForm as contactFormData } from '../seed/contact-form'
import { contact as contactPageData } from '../seed/contact-page'
import { seedMembers } from './chamber-members'

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
  'contacts',
  'members',
  'membership-tiers',
  'orders',
  'audit-log',
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
 * Nuke and reseed the entire database with SGBCC content.
 *
 * Called from POST /next/seed-sgbcc.
 */
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding SGBCC database...')

  // ─── Step 1: Clear everything ──────────────────────────────────

  payload.logger.info('— Clearing collections and globals...')

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

  // Delete FK-dependent collections first (members → contacts, orders → contacts)
  for (const collection of ['orders', 'members', 'membership-tiers', 'audit-log'] as const) {
    await payload.db.deleteMany({ collection, req, where: {} })
  }

  await Promise.all(
    collections
      .filter((c) => !['orders', 'members', 'membership-tiers', 'audit-log'].includes(c))
      .map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection]?.config?.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  // Remove the demo author user if it exists from a previous seed
  await payload.delete({
    collection: 'users',
    depth: 0,
    where: { email: { equals: 'demo-author@sgbcc.ca' } },
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
      name: 'SGBCC Communications',
      email: 'demo-author@sgbcc.ca',
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
    data: memberSpotlight({
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
      data: businessAfterHoursEvent({
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

  // ─── Step 7b: Create membership tiers, contacts, members ──────

  await seedMembers(payload)

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
          swan: images['seal-testimonial.png'],
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
          {
            link: {
              type: 'custom' as const,
              label: 'News',
              url: '/posts',
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
      },
    }),

    // ── Footer ──
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
              { link: { type: 'custom' as const, label: 'Contact Us', url: '/contact' } },
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
              { link: { type: 'custom' as const, label: 'Admin', url: '/admin' } },
            ],
          },
        ],
        copyright: '© {year} Southern Georgian Bay Chamber of Commerce. All rights reserved.',
      },
    }),

    // ── Site Settings ──
    payload.updateGlobal({
      slug: 'site-settings',
      data: {
        // Branding
        siteName: 'Southern Georgian Bay Chamber of Commerce',
        logo: images['chamber-logo.png'].id,
        tagline: 'Your Business. Your Community. Your Bay.',

        // Contact
        address: '208 King Street\nMidland, ON  L4R 3L9\nCanada',
        phone: '(705) 526-7884',
        email: 'info@sgbcc.ca',

        // Social Links
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/sgbcc' },
          { platform: 'linkedin', url: 'https://linkedin.com/company/sgbcc' },
          { platform: 'instagram', url: 'https://instagram.com/sgbcc' },
        ],

        // Theme — Bay palette: deep navy primary, Georgian green secondary, warm gold accent
        primaryColor: '#1a3550',
        secondaryColor: '#2d6a4f',
        accentColor: '#d4a843',

        // Fonts
        headingFont: "var(--font-montserrat), 'Montserrat', sans-serif",
        bodyFont: "var(--font-montserrat), 'Montserrat', sans-serif",
      },
    }),
  ])

  payload.logger.info('Seeded SGBCC database successfully!')
}
