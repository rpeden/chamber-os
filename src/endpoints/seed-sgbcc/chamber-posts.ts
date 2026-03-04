/**
 * Chamber seed posts — three blog posts about life in Southern Georgian Bay
 * where trumpeter swans patrol the waterfront and a bird named Sir Honksalot
 * sits on the board of directors with terrifying conviction.
 *
 * Each post is built using the Lexical helpers so the content is actually readable
 * in this file instead of being 300 lines of nested JSON that nobody can review.
 */

import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media, User, Category } from '@/payload-types'
import { h2, lexicalRoot, p, paragraph, bold, text } from '../seed/lexical-helpers'

type PostDeps = {
  heroImage: Media
  author: User
  category: Category
}

// ── Post 1: Economic Forecast ──────────────────────────────────────────────

export function economicForecastPost({
  heroImage,
  author,
  category,
}: PostDeps): RequiredDataFromCollectionSlug<'posts'> {
  return {
    slug: '2026-economic-forecast',
    _status: 'published',
    title: '2026 Economic Forecast: Tourism Up, Swan Activity Also Up',
    authors: [author],
    heroImage: heroImage.id,
    categories: [category],
    publishedAt: new Date('2026-01-15T09:00:00').toISOString(),
    content: lexicalRoot(
      p(
        'The Southern Georgian Bay Chamber of Commerce has released its 2026 Economic Outlook, and the headline is encouraging: the local business community enters the year in a position of cautious optimism, buoyed by strong tourism numbers, steady population growth, and an 11% increase in new business registrations across Midland, Penetanguishene, Tiny, and Tay.',
      ),
      paragraph(
        text(
          '"Our region is hitting its stride," said Executive Director Claire Beaumont. "The combination of natural beauty, heritage tourism, and a growing remote-work population has created real momentum. We\'re not just a summer destination anymore — we\'re becoming a year-round economy."',
        ),
      ),
      h2('Key Findings'),
      paragraph(
        bold('Tourism revenue'),
        text(
          ' grew 9% year-over-year, driven by a strong summer season at Discovery Harbour, Sainte-Marie among the Hurons, and the expanding Georgian Bay Islands National Park visitor base. Winter tourism is also growing, with ice fishing, snowshoeing, and the Midland Butter Tart Festival drawing increasing numbers.',
        ),
      ),
      paragraph(
        bold('Small business survival rates'),
        text(
          ' remain above the national average, with 89% of businesses that opened in 2023 still operating. The Chamber attributes this partly to its mentorship programs and partly to what Beaumont calls "a community that genuinely supports its own."',
        ),
      ),
      paragraph(
        bold('The swan situation'),
        text(
          ' warrants mention. Trumpeter swan activity on the Midland waterfront increased 31% in 2025, consistent with the species\' successful recovery but creating novel challenges for businesses along King Street and the town dock. Boathouse Restaurant reported that its outdoor patio furniture budget has tripled since 2023, and the Midland Marina now employs a part-time "swan liaison" — a position that did not exist two years ago.',
        ),
      ),
      h2('Outlook'),
      p(
        'The Chamber\'s forecast models project continued moderate growth through 2026, with particular opportunity in waterfront hospitality, heritage tourism, marine services, and what the report terms "quality of life migration" — professionals relocating from the GTA who bring their jobs with them and their spending power downstream.',
      ),
      p(
        'The full report is available to Chamber members through the Member Portal. A summary presentation will be given at the February Lunch & Learn at the Midland Cultural Centre (venue confirmed swan-free as of publication).',
      ),
    ),
    meta: {
      title: '2026 Economic Forecast — Southern Georgian Bay Chamber',
      description:
        "The Chamber's annual economic outlook finds local businesses thriving amid strong tourism and an increasingly confident swan population.",
      image: heroImage.id,
    },
  }
}

// ── Post 2: Sir Honksalot Elected President ────────────────────────────────

export function newBoardMemberPost({
  heroImage,
  author,
  category,
}: PostDeps): RequiredDataFromCollectionSlug<'posts'> {
  return {
    slug: 'chamber-welcomes-new-board-member',
    _status: 'published',
    title: 'Sir Honksalot Elected Board President',
    authors: [author],
    heroImage: heroImage.id,
    categories: [category],
    publishedAt: new Date('2026-01-22T10:00:00').toISOString(),
    content: lexicalRoot(
      paragraph(
        text('The Southern Georgian Bay Chamber of Commerce is proud to announce that '),
        bold('Sir Honksalot'),
        text(
          ', a trumpeter swan who has been a fixture of the Midland waterfront for over a decade, has been elected Board President by unanimous vote.',
        ),
      ),
      p(
        'Sir Honksalot has volunteered with the Chamber for over ten years, serving on several committees including Tourism & Hospitality, Waterfront Development, and the Events Planning Subcommittee. Their election directly to the presidency — bypassing the usual progression through the vice-presidency — follows the retirement of outgoing president Joanne Marchand, who served the Chamber with distinction for seven years.',
      ),
      p(
        '"Sir Honksalot has been the most reliable presence at this Chamber for as long as anyone can remember," said Vice President Marcus Delacroix. "Ten years of committee work. They show up before anyone else — usually by landing on the roof of the Chamber office — and they have this way of cutting through the noise that the rest of us could learn from. The vote was unanimous for a reason."',
      ),
      p(
        'The new president brings deep expertise in waterfront resource management, seasonal migration planning, and what colleagues describe as an unparalleled ability to maintain focus during lengthy budget discussions.',
      ),
      p(
        'Sir Honksalot\'s first act as president was chairing the January board meeting, which fellow members described as "the most efficient meeting in Chamber history." Meeting minutes note that the agenda was completed twenty-two minutes ahead of schedule, attributed largely to the president\'s unwillingness to entertain tangents and a honk of unmistakable finality deployed whenever discussion drifted.',
      ),
      p(
        'The Chamber congratulates Sir Honksalot on this well-deserved appointment and looks forward to their leadership in advancing regional economic development across Southern Georgian Bay.',
      ),
    ),
    meta: {
      title: 'Sir Honksalot Elected Board President — Southern Georgian Bay Chamber',
      description:
        'The Southern Georgian Bay Chamber of Commerce is pleased to announce the election of Sir Honksalot as Board President.',
      image: heroImage.id,
    },
  }
}

// ── Post 3: Member Spotlight — Georgian Bay Outfitters ──────────────────────

export function memberSpotlight({
  heroImage,
  author,
  category,
}: PostDeps): RequiredDataFromCollectionSlug<'posts'> {
  return {
    slug: 'member-spotlight-georgian-bay-outfitters',
    _status: 'published',
    title: 'Member Spotlight: Georgian Bay Outfitters',
    authors: [author],
    heroImage: heroImage.id,
    categories: [category],
    publishedAt: new Date('2026-02-01T09:00:00').toISOString(),
    content: lexicalRoot(
      paragraph(
        text("This month's Member Spotlight shines on "),
        bold('Georgian Bay Outfitters'),
        text(
          ", one of the region's most beloved outdoor recreation businesses and a fixture of the Penetanguishene waterfront since 1991.",
        ),
      ),
      paragraph(
        text('Owner '),
        bold('Marie-Claire Dufresne'),
        text(
          ' took over the shop from its original founder in 2014 and has spent the last twelve years evolving the business from a seasonal bait-and-tackle shop into a full-service outfitter serving paddlers, anglers, hikers, and winter adventurers year-round.',
        ),
      ),
      p(
        '"People come here because the Bay is extraordinary," Dufresne explains. "My job is to make sure they have everything they need to experience it safely and come back next year. I\'m not selling gear — I\'m selling the best weekend of someone\'s year."',
      ),
      p(
        'Georgian Bay Outfitters stocks an improbable range of equipment — from canoes and kayaks to ice fishing huts, snowshoes, and a surprisingly well-curated selection of regional trail maps and field guides that Dufresne sources from local artists. "People are always surprised by the maps," she says. "Just because GPS exists doesn\'t mean you shouldn\'t know where you are."',
      ),
      h2('Adapting to Change'),
      p(
        "Dufresne credits the Chamber's small business programs with helping her navigate the shift to online booking and equipment rentals. \"Claire [Beaumont, Chamber ED] connected me with a tourism consultant who understood seasonal businesses. We built an online reservation system that actually works with our rental fleet. I'm not competing with MEC — I'm serving the people who want to be on the water in an hour, not wait for a shipment.\"",
      ),
      p(
        'The shop also serves as an informal community gathering point, hosting a weekly paddlers\' coffee morning from May through October that regularly draws twenty-five to thirty locals. "Some mornings the swans show up too," Dufresne notes, gesturing toward the dock. "They\'re less interested in the coffee and more interested in asserting dominance over the kayak launch."',
      ),
      h2('Chamber Membership'),
      p(
        'Dufresne has been a Chamber member since taking over the business and currently sits on the Tourism & Hospitality Committee. "The Chamber is how we punch above our weight," she says. "Every business around the Bay is fighting for attention against Muskoka and Collingwood. Together, through the Chamber, we make the case that Southern Georgian Bay is the real deal."',
      ),
      p(
        'Georgian Bay Outfitters is located at 22 Main Street, Penetanguishene, and is open year-round: Monday through Saturday 8 AM to 6 PM (extended summer hours). Visit their profile in the Chamber Member Directory for more information.',
      ),
    ),
    meta: {
      title: 'Member Spotlight: Georgian Bay Outfitters — Southern Georgian Bay Chamber',
      description:
        "From bait shop to year-round outfitter — how one of Penetanguishene's best-loved businesses keeps evolving.",
      image: heroImage.id,
    },
  }
}
