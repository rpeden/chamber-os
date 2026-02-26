/**
 * Chamber seed events — four upcoming events for the Southern Hudson Bay
 * Chamber of Commerce. Each one sounds plausible enough to be real,
 * absurd enough to be memorable.
 *
 * All events use Lexical richText for the description field.
 */

import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'
import { lexicalRoot, p, h3, paragraph, bold, text } from './lexical-helpers'

type EventDeps = {
  featuredImage: Media
}

/**
 * Generate an ISO date string offset from "now" by a given number of days and hours.
 * This keeps events perpetually "upcoming" relative to whenever the seed runs.
 */
function futureDate(daysFromNow: number, hour: number = 18, minute: number = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// ── Event 1: Business After Bears ──────────────────────────────────────────

export function businessAfterBearsEvent({
  featuredImage,
}: EventDeps): RequiredDataFromCollectionSlug<'events'> {
  return {
    title: 'Business After Bears',
    slug: 'business-after-bears',
    status: 'published',
    location: 'Northern Lights Community Centre, 42 Polar Drive',
    startDate: futureDate(14, 18, 0),
    endDate: futureDate(14, 21, 0),
    featuredImage: featuredImage.id,
    isFeatured: true,
    isChambersEvent: true,
    ticketingType: 'none',
    description: lexicalRoot(
      p(
        'Join fellow Chamber members for our signature networking event — Business After Bears. Once the polar bears have settled in for the evening, we come out to connect.',
      ),
      p(
        'This monthly after-hours event is the best way to meet other business owners and community leaders in a relaxed setting. Appetizers and a cash bar provided. Business cards recommended.',
      ),
      h3('What to Expect'),
      paragraph(
        bold('Networking:'),
        text(' Structured icebreakers for the first 30 minutes, then open mingling.'),
      ),
      paragraph(
        bold('Refreshments:'),
        text(' Local catering by Tundra Kitchen. Vegetarian and gluten-free options available.'),
      ),
      paragraph(
        bold('Safety note:'),
        text(
          ' As always, bear patrol will confirm the all-clear before doors open. Please do not prop open exterior doors.',
        ),
      ),
    ),
  }
}

// ── Event 2: Lunch & Learn — 2026 Economic Forecast ────────────────────────

export function lunchAndLearnEvent({
  featuredImage,
}: EventDeps): RequiredDataFromCollectionSlug<'events'> {
  return {
    title: 'Lunch & Learn: 2026 Economic Forecast Deep Dive',
    slug: 'lunch-and-learn-economic-forecast',
    status: 'published',
    location: 'Chamber Board Room, 100 Shoreline Road',
    startDate: futureDate(21, 12, 0),
    endDate: futureDate(21, 13, 30),
    featuredImage: featuredImage.id,
    isFeatured: false,
    isChambersEvent: true,
    ticketingType: 'none',
    description: lexicalRoot(
      p(
        "Executive Director Margaret Fenn presents the full findings of the Chamber's 2026 Economic Outlook. Lunch is included — arrive hungry, leave informed.",
      ),
      h3('Agenda'),
      paragraph(bold('12:00 PM'), text(' — Lunch service and informal networking')),
      paragraph(
        bold('12:30 PM'),
        text(' — Presentation: Key findings, growth sectors, and the bear economy'),
      ),
      paragraph(bold('1:00 PM'), text(' — Q&A and open discussion')),
      p(
        'Seating is limited to 30 attendees. RSVP through the Chamber office or reply to the email invitation.',
      ),
    ),
  }
}

// ── Event 3: Annual Business Awards Gala ───────────────────────────────────

export function awardsGalaEvent({
  featuredImage,
}: EventDeps): RequiredDataFromCollectionSlug<'events'> {
  return {
    title: 'Annual Business Awards Gala',
    slug: 'annual-business-awards-gala',
    status: 'published',
    location: 'Bay Grand Hotel, 1 Harbour View Blvd',
    startDate: futureDate(45, 18, 0),
    endDate: futureDate(45, 23, 0),
    featuredImage: featuredImage.id,
    isFeatured: true,
    isChambersEvent: true,
    ticketingType: 'external-link',
    externalTicketUrl: 'https://example.com/gala-tickets',
    description: lexicalRoot(
      p(
        "The Southern Hudson Bay Chamber of Commerce's most anticipated event of the year. Join us for an evening celebrating the businesses and individuals who make this community extraordinary.",
      ),
      h3('Award Categories'),
      paragraph(
        bold('Business of the Year'),
        text(' — Recognizing outstanding achievement and community contribution'),
      ),
      paragraph(
        bold('Emerging Entrepreneur'),
        text(' — Celebrating new businesses making an immediate impact'),
      ),
      paragraph(
        bold('Community Builder'),
        text(' — Honouring dedication to the broader community beyond business'),
      ),
      paragraph(
        bold('Innovation Award'),
        text(' — For creative solutions to uniquely northern challenges'),
      ),
      h3('Details'),
      p(
        "Black tie optional. Dinner, live music, and an open bar are included with your ticket. Keynote speaker to be announced. Last year's gala sold out three weeks in advance — book early.",
      ),
    ),
  }
}

// ── Event 4: First Friday Networking ───────────────────────────────────────

export function firstFridayEvent({
  featuredImage,
}: EventDeps): RequiredDataFromCollectionSlug<'events'> {
  return {
    title: 'First Friday Networking',
    slug: 'first-friday-networking',
    status: 'published',
    location: 'The Polar Tap House, 8 Main Street',
    startDate: futureDate(7, 17, 0),
    endDate: futureDate(7, 19, 0),
    featuredImage: featuredImage.id,
    isFeatured: false,
    isChambersEvent: true,
    ticketingType: 'none',
    description: lexicalRoot(
      p(
        "The first Friday of every month, Chamber members and friends gather at the Polar Tap House for casual networking over local craft beers and appetizers. It's low-key, no agenda, no presentations — just good conversation and the occasional wildlife sighting through the window.",
      ),
      p(
        'Open to members and non-members alike. Bring a colleague, bring a friend, bring your business card. First drink is on the Chamber.',
      ),
      p(
        'Note: The Polar Tap House has reinforced its patio since the September incident. Outdoor seating is once again available.',
      ),
    ),
  }
}
