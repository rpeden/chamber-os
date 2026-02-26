/**
 * Homepage composition for the Southern Hudson Bay Chamber of Commerce.
 *
 * This is the WF.2 deliverable — a fully composed homepage that uses
 * the block architecture to create an OBOT-style section flow:
 *
 *   1. Full-bleed hero with dramatic coastline shot
 *   2. About section (Content block) — who we are
 *   3. Stats bar — impressive numbers
 *   4. Events list — dynamic, pulls upcoming events
 *   5. News feed — dynamic, pulls latest posts
 *   6. Testimonials — three members (two humans, one seal)
 *   7. Sponsors grid — four sponsor logos
 *   8. CTA banner — join the Chamber
 *
 * The homepage is the first thing a prospective member sees.
 * It needs to feel professional and alive — not like a template
 * that someone forgot to fill in.
 */

import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'
import { lexicalRoot, h2, h3, p, paragraph, text, bold } from './lexical-helpers'

type HomeArgs = {
  heroImage: Media
  metaImage: Media
  testimonialPhotos: {
    human1: Media
    human2: Media
    seal: Media
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
      heading: 'Southern Hudson Bay Chamber of Commerce',
      subheading:
        'Supporting business, building community, and coexisting with wildlife since 1987.',
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
            size: 'full',
            richText: lexicalRoot(h2('Your Voice in the North')),
          },
          {
            size: 'twoThirds',
            richText: lexicalRoot(
              p(
                'The Southern Hudson Bay Chamber of Commerce is the collective voice of the business community on the southern shores of Hudson Bay. We advocate for our members at the municipal, provincial, and federal level. We provide networking opportunities, business development resources, and a shared platform for the entrepreneurs and organizations that keep this region thriving.',
              ),
              p(
                "Our community is remote, resilient, and resourceful. The businesses here serve populations that larger supply chains forget, in conditions that would make southern operators reconsider their life choices. We're here to make sure they don't have to do it alone.",
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
            ),
          },
        ],
      },

      // ── Section 2: Stats Bar ─────────────────────────────────────
      // If your Chamber doesn't want a "by the numbers" section, swap
      // in one of these alternative stat-bar presets. Each tells a story
      // without requiring hard data. Just uncomment one block and comment
      // out the active one.
      //
      // ── ALT A: Value Proposition ──
      // {
      //   blockName: 'Why Join',
      //   blockType: 'statsBar',
      //   sectionHeading: 'Why Join the Chamber?',
      //   stats: [
      //     { number: '🤝', label: 'Networking & Connections' },
      //     { number: '📣', label: 'Advocacy & Representation' },
      //     { number: '📈', label: 'Business Resources' },
      //     { number: '🌍', label: 'Community Impact' },
      //   ],
      //   background: 'brand',
      // },
      //
      // ── ALT B: Member Services ──
      // {
      //   blockName: 'What We Offer',
      //   blockType: 'statsBar',
      //   sectionHeading: 'What We Offer',
      //   stats: [
      //     { number: '24/7', label: 'Member Support' },
      //     { number: '50+', label: 'Annual Events' },
      //     { number: 'Free', label: 'Marketing Exposure' },
      //     { number: '1-on-1', label: 'Business Mentoring' },
      //   ],
      //   background: 'brand',
      // },
      //
      // ── ALT C: Aspirational / Mission ──
      // {
      //   blockName: 'Our Mission',
      //   blockType: 'statsBar',
      //   sectionHeading: 'Our Commitments',
      //   stats: [
      //     { number: 'Connect', label: 'Business to Business' },
      //     { number: 'Advocate', label: 'For Local Interests' },
      //     { number: 'Grow', label: 'The Regional Economy' },
      //     { number: 'Support', label: 'Every Entrepreneur' },
      //   ],
      //   background: 'brand',
      // },
      //
      // ── ALT D: Timeline / Milestones (no hard data needed) ──
      // {
      //   blockName: 'Milestones',
      //   blockType: 'statsBar',
      //   sectionHeading: 'Our Journey',
      //   stats: [
      //     { number: 'Est.', label: 'Year Founded' },
      //     { number: '✓', label: 'Community Leader' },
      //     { number: '∞', label: 'Member Driven' },
      //     { number: '→', label: 'Always Growing' },
      //   ],
      //   background: 'brand',
      // },
      {
        blockName: 'Chamber Stats',
        blockType: 'statsBar',
        sectionHeading: 'By the Numbers',
        stats: [
          { number: '150+', label: 'Member Businesses' },
          { number: '37', label: 'Years Serving the Bay' },
          { number: '87%', label: 'Business Survival Rate' },
          { number: '12%', label: 'New Business Growth' },
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
            pullquote: 'The Chamber is the connective tissue of this community.',
            fullQuote: lexicalRoot(
              p(
                '"The Chamber is the connective tissue of this community. Every business up here is too small to advocate for itself. Together, through the Chamber, we actually get heard in Thunder Bay and Toronto."',
              ),
            ),
            attributionName: 'Janet Kowalchuk',
            attributionOrg: 'Hudson Bay Trading Post',
            photo: testimonialPhotos.human1.id,
          },
          {
            pullquote: "Reliable logistics isn't a convenience — it's survival.",
            fullQuote: lexicalRoot(
              p(
                '"Up here, reliable logistics isn\'t a convenience — it\'s survival. The Chamber gives us the collective voice to advocate for the infrastructure this region needs."',
              ),
            ),
            attributionName: 'Ronny Thomas',
            attributionOrg: 'Singh Arctic Freight',
            photo: testimonialPhotos.human2.id,
          },
          {
            pullquote: 'Very present. Attentive. Reliable.',
            fullQuote: lexicalRoot(
              p(
                '"Very present. Attentive. Reliable." — Board colleagues on President Natsiq\'s leadership style. Under their tenure, membership has grown 15% and meetings have become noticeably more efficient.',
              ),
            ),
            attributionName: 'Natsiq',
            attributionOrg: 'Board President',
            photo: testimonialPhotos.seal.id,
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
                sponsorName: 'Hudson Bay Trading Post',
                url: 'https://example.com',
              },
              {
                logo: sponsorLogos.logo2.id,
                sponsorName: 'Arctic Insurance Group',
                url: 'https://example.com',
              },
              {
                logo: sponsorLogos.logo3.id,
                sponsorName: 'Polar Express Logistics',
                url: 'https://example.com',
              },
              {
                logo: sponsorLogos.logo4.id,
                sponsorName: 'Seal of Approval Accounting',
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
        heading: 'Join the Southern Hudson Bay Chamber of Commerce',
        body: lexicalRoot(
          p(
            'Membership gives you a voice in regional advocacy, access to networking events, business development resources, and a community of entrepreneurs who understand what it takes to do business in the north.',
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
      title: 'Southern Hudson Bay Chamber of Commerce',
      description:
        'The Southern Hudson Bay Chamber of Commerce supports local businesses, advocates for regional economic development, and builds community on the shores of Hudson Bay.',
      image: metaImage.id,
    },
  }
}
