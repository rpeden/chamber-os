/**
 * Homepage composition for the Southern Georgian Bay Chamber of Commerce.
 *
 *   1. Full-bleed hero with Georgian Bay waterfront shot
 *   2. About section (Content block) — who we are
 *   3. Stats bar — impressive numbers
 *   4. Events list — dynamic, pulls upcoming events
 *   5. News feed — dynamic, pulls latest posts
 *   6. Testimonials — three members (two humans, one swan)
 *   7. Sponsors grid — four sponsor logos
 *   8. CTA banner — join the Chamber
 */

import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'
import { lexicalRoot, h2, h3, p } from '../seed/lexical-helpers'

type HomeArgs = {
  heroImage: Media
  metaImage: Media
  testimonialPhotos: {
    human1: Media
    human2: Media
    swan: Media
  }
  sponsorLogos: {
    logo1: Media
    logo2: Media
    logo3: Media
    logo4: Media
  }
}

export function chamberHomepage({
  heroImage,
  metaImage,
  testimonialPhotos,
  sponsorLogos,
}: HomeArgs): RequiredDataFromCollectionSlug<'pages'> {
  return {
    slug: 'home',
    _status: 'published',
    title: 'Home',
    hero: {
      type: 'fullBleed',
      textLayout: 'single-text',
      heading:
        'Supporting business, building community, and coexisting with waterfowl since 1992.',
      media: heroImage.id,
      overlayOpacity: 65,
      ctaButtons: [
        {
          variant: 'primary',
          link: {
            type: 'custom',
            label: 'Upcoming Events',
            url: '/events',
          },
        },
        {
          variant: 'secondary',
          link: {
            type: 'custom',
            label: 'Join the Chamber',
            url: '/contact',
          },
        },
      ],
    },
    layout: [
      // ── Section 1: About the Chamber ─────────────────────────────
      {
        blockName: 'About the Chamber',
        blockType: 'content',
        columns: [
          {
            size: 'twoThirds',
            richText: lexicalRoot(
              h2('Your Voice on the Bay'),
              p(
                'The Southern Georgian Bay Chamber of Commerce is the collective voice of the business community across Midland, Penetanguishene, Tiny, and Tay. We advocate for our members at the municipal, county, provincial, and federal level. We provide networking opportunities, business development resources, and a shared platform for the entrepreneurs and organizations that keep this region thriving.',
              ),
              p(
                "Our region is beautiful, historic, and increasingly hard to leave. The businesses here serve a mix of year-round residents, seasonal cottagers, and visitors who come for the Bay and stay for the community. We're here to make sure they all have what they need to succeed.",
              ),
            ),
          },
          {
            size: 'oneThird',
            richText: lexicalRoot(
              h3('Get Involved'),
              p(
                "Whether you're a new business looking for support or an established enterprise seeking to give back, the Chamber has a seat at the table for you.",
              ),
              p(
                'Membership gives you access to networking events, a listing in our business directory, and a community of peers who understand summer rush, winter quiet, and the occasional swan incursion.',
              ),
            ),
          },
        ],
      },

      // ── Section 2: Stats Bar ─────────────────────────────────────
      {
        blockName: 'Chamber Stats',
        blockType: 'statsBar',
        sectionHeading: 'By the Numbers',
        stats: [
          { number: '200+', label: 'Member Businesses' },
          { number: '33', label: 'Years Serving the Bay' },
          { number: '89%', label: 'Business Survival Rate' },
          { number: '11%', label: 'New Business Growth' },
        ],
        background: 'brand',
      },

      // ── Section 3: Events List (dynamic) ─────────────────────────
      {
        blockName: 'Upcoming Events',
        blockType: 'eventsList',
        sectionHeading: 'Upcoming Events',
        introText:
          "From networking nights to professional development, there's always something happening at the Chamber.",
        displayMode: 'upcoming',
        maxItems: 3,
        enableViewAllLink: true,
        viewAllLink: {
          type: 'custom',
          label: 'View All Events',
          url: '/events',
        },
        background: 'default',
      },

      // ── Section 4: News Feed (dynamic) ───────────────────────────
      {
        blockName: 'Latest News',
        blockType: 'newsFeed',
        sectionHeading: 'Latest News',
        introText:
          'Stay up to date with Chamber announcements, member spotlights, and community economic news.',
        maxItems: 3,
        enableViewAllLink: true,
        viewAllLink: {
          type: 'custom',
          label: 'View All News',
          url: '/posts',
        },
        background: 'light',
      },

      // ── Section 5: Testimonials ──────────────────────────────────
      {
        blockName: 'Member Voices',
        blockType: 'testimonials',
        sectionHeading: 'What Our Members Say',
        testimonials: [
          {
            pullquote: 'The Chamber is how we punch above our weight.',
            fullQuote: lexicalRoot(
              p(
                '"The Chamber is how we punch above our weight. Every business around the Bay is fighting for attention against Muskoka and Collingwood. Together, through the Chamber, we make the case that Southern Georgian Bay is the real deal."',
              ),
            ),
            attributionName: 'Marie-Claire Dufresne',
            attributionOrg: 'Georgian Bay Outfitters',
            photo: testimonialPhotos.human1.id,
          },
          {
            pullquote:
              "Southern Georgian Bay has everything going for it — we just need to tell the story.",
            fullQuote: lexicalRoot(
              p(
                '"Southern Georgian Bay has everything going for it — the water, the history, the community. The Chamber gives us the coordinated voice to make sure people know about it before they default to Muskoka."',
              ),
            ),
            attributionName: 'Marcus Delacroix',
            attributionOrg: 'Georgian Bay Hotel',
            photo: testimonialPhotos.human2.id,
          },
          {
            pullquote: 'Commanding. Very present. Surprisingly efficient.',
            fullQuote: lexicalRoot(
              p(
                '"Commanding. Very present. Surprisingly efficient." — Board colleagues on President Sir Honksalot\'s leadership style. Under their tenure, membership has grown 14% and meetings have become noticeably more decisive.',
              ),
            ),
            attributionName: 'Sir Honksalot',
            attributionOrg: 'Board President',
            photo: testimonialPhotos.swan.id,
          },
        ],
        autoAdvance: true,
        background: 'default',
      },

      // ── Section 6: Sponsors Grid ─────────────────────────────────
      {
        blockName: 'Our Sponsors',
        blockType: 'sponsorsGrid',
        sectionHeading: 'Our Sponsors',
        tiers: [
          {
            tierName: 'Community Partners',
            displayMode: 'grid',
            logos: [
              {
                logo: sponsorLogos.logo1.id,
                sponsorName: 'Georgian Bay Outfitters',
                url: 'https://example.com',
              },
              {
                logo: sponsorLogos.logo2.id,
                sponsorName: 'Huronia Insurance Group',
                url: 'https://example.com',
              },
              {
                logo: sponsorLogos.logo3.id,
                sponsorName: 'Bay Marine Services',
                url: 'https://example.com',
              },
              {
                logo: sponsorLogos.logo4.id,
                sponsorName: 'Trumpeter Financial',
                url: 'https://example.com',
              },
            ],
          },
        ],
        background: 'light',
      },

      // ── Section 7: CTA Banner ────────────────────────────────────
      {
        blockName: 'Join CTA',
        blockType: 'ctaBanner',
        heading: 'Join the Southern Georgian Bay Chamber of Commerce',
        body: lexicalRoot(
          p(
            'Membership gives you a voice in regional advocacy, access to networking events, business development resources, and a community of entrepreneurs who understand what it takes to do business on the Bay.',
          ),
        ),
        link: {
          type: 'custom',
          label: 'Become a Member',
          url: '/contact',
        },
        ctaVariant: 'accent',
        background: 'dark',
      },
    ],
    meta: {
      title: 'Southern Georgian Bay Chamber of Commerce',
      description:
        'The Southern Georgian Bay Chamber of Commerce supports local businesses, advocates for regional economic development, and builds community across Midland, Penetanguishene, Tiny, and Tay.',
      image: metaImage.id,
    },
  }
}
