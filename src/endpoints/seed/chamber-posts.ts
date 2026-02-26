/**
 * Chamber seed posts — three blog posts about life in a subarctic chamber of commerce
 * where polar bears wander Main Street and a seal sits on the board.
 *
 * Each post is built using the Lexical helpers so the content is actually readable
 * in this file instead of being 300 lines of nested JSON that nobody can review.
 */

import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media, User, Category } from '@/payload-types'
import { h2, lexicalRoot, p, paragraph, bold, text } from './lexical-helpers'

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
    title: '2026 Economic Forecast: Cautiously Optimistic Despite Increased Bear Activity',
    authors: [author],
    heroImage: heroImage.id,
    categories: [category],
    publishedAt: new Date('2026-01-15T09:00:00').toISOString(),
    content: lexicalRoot(
      p(
        'The Southern Hudson Bay Chamber of Commerce has released its 2026 Economic Outlook, and the headline is encouraging: the local business community enters the year in a position of cautious optimism, buoyed by steady tourism growth, a robust small business retention rate, and a 12% increase in new business registrations over the previous fiscal year.',
      ),
      paragraph(
        text(
          '"Our members have demonstrated remarkable resilience," said Executive Director Margaret Fenn. "Whether it\'s supply chain challenges, infrastructure limitations, or the increasingly bold wildlife presence downtown, this community adapts."',
        ),
      ),
      h2('Key Findings'),
      paragraph(
        bold('Tourism revenue'),
        text(
          ' grew 8% year-over-year, driven largely by eco-tourism and northern adventure travel. The Chamber\'s partnership with regional outfitters has helped position Southern Hudson Bay as a destination for visitors seeking authentic subarctic experiences — which, as Fenn noted, "they certainly get."',
        ),
      ),
      paragraph(
        bold('Small business survival rates'),
        text(
          ' remain above the national average, with 87% of businesses that opened in 2023 still operating. The Chamber attributes this partly to its mentorship programs and partly to what it diplomatically calls "a self-selecting entrepreneurial population."',
        ),
      ),
      paragraph(
        bold('The bear situation'),
        text(
          ' warrants mention. Polar bear encounters in the commercial district increased 23% in 2025, consistent with broader regional trends. While this presents operational challenges — particularly for businesses with street-level signage and outdoor displays — local enterprises have adapted. Hardware store Bearings & Bolts reported that its reinforced storefront glass product line now accounts for 15% of annual revenue, a category that did not exist three years ago.',
        ),
      ),
      h2('Outlook'),
      p(
        'The Chamber\'s forecast models project continued moderate growth through 2026, with particular opportunity in remote work infrastructure, cold-climate construction services, and what the report terms "wildlife coexistence consulting" — a sector that barely existed five years ago and now employs fourteen people locally.',
      ),
      p(
        'The full report is available to Chamber members through the Member Portal. A summary presentation will be given at the February Lunch & Learn on the 19th (venue confirmed bear-free as of publication).',
      ),
    ),
    meta: {
      title: '2026 Economic Forecast — Southern Hudson Bay Chamber',
      description:
        "The Chamber's annual economic outlook finds local businesses adapting well to shifting conditions — seasonal and otherwise.",
      image: heroImage.id,
    },
  }
}

// ── Post 2: Natsiq Elected President ───────────────────────────────────────

export function newBoardMemberPost({
  heroImage,
  author,
  category,
}: PostDeps): RequiredDataFromCollectionSlug<'posts'> {
  return {
    slug: 'chamber-welcomes-new-board-member',
    _status: 'published',
    title: 'Natsiq Elected Board President',
    authors: [author],
    heroImage: heroImage.id,
    categories: [category],
    publishedAt: new Date('2026-01-22T10:00:00').toISOString(),
    content: lexicalRoot(
      paragraph(
        text('The Southern Hudson Bay Chamber of Commerce is proud to announce that '),
        bold('Natsiq'),
        text(
          ', a ringed seal who has been a fixture of the Hudson Bay shoreline community for over a decade, has been elected Board President by unanimous vote.',
        ),
      ),
      p(
        'Natsiq has volunteered with the Chamber for over a decade, serving on several committees including Membership & Engagement, Economic Development, and the Events Planning Subcommittee. Their election directly to the presidency — bypassing the usual progression through the vice-presidency — follows the retirement of outgoing president Gerald Firth, who served the Chamber with distinction for nine years.',
      ),
      p(
        '"Natsiq has been the most reliable presence at this Chamber for as long as anyone can remember," said Vice President Raymond Singh. "Ten years of committee work. They show up before anyone else, they never miss a meeting, and they have this way of cutting through the noise that the rest of us could learn from. The vote was unanimous for a reason."',
      ),
      p(
        'The new president brings deep expertise in marine resource management, seasonal adaptation, and what colleagues describe as an unparalleled ability to maintain focus during lengthy budget discussions.',
      ),
      p(
        'Natsiq\'s first act as president was chairing the January board meeting, which fellow members described as "the most efficient meeting in Chamber history." Meeting minutes note that the agenda was completed twenty minutes ahead of schedule, attributed largely to the president\'s unwillingness to entertain tangents.',
      ),
      p(
        'The Chamber congratulates Natsiq on this well-deserved appointment and looks forward to their leadership in advancing community economic development on the southern Hudson Bay coast.',
      ),
    ),
    meta: {
      title: 'Natsiq Elected Board President — Southern Hudson Bay Chamber',
      description:
        'The Southern Hudson Bay Chamber of Commerce is pleased to announce the election of Natsiq as Board President.',
      image: heroImage.id,
    },
  }
}

// ── Post 3: Member Spotlight — Hudson Bay Trading Post ─────────────────────

export function tradingPostSpotlight({
  heroImage,
  author,
  category,
}: PostDeps): RequiredDataFromCollectionSlug<'posts'> {
  return {
    slug: 'member-spotlight-hudson-bay-trading-post',
    _status: 'published',
    title: 'Member Spotlight: Hudson Bay Trading Post',
    authors: [author],
    heroImage: heroImage.id,
    categories: [category],
    publishedAt: new Date('2026-02-01T09:00:00').toISOString(),
    content: lexicalRoot(
      paragraph(
        text("This month's Member Spotlight shines on "),
        bold('Hudson Bay Trading Post'),
        text(
          ", the community's oldest continuously operating business and a cornerstone of the Southern Hudson Bay commercial district since 1987.",
        ),
      ),
      paragraph(
        text('Owner '),
        bold('Janet Kowalchuk'),
        text(
          ' took over the Trading Post from her parents in 2012 and has spent the last fourteen years evolving the business from a traditional general store into what she calls "a community supply chain of one."',
        ),
      ),
      p(
        '"Out here, you can\'t just pop over to the next town," Kowalchuk explains. "If we don\'t carry it, people have to wait for a shipment or go without. That responsibility shapes everything about how we run this place."',
      ),
      p(
        'The Trading Post stocks an improbable range of goods — from grocery staples and hardware supplies to winter gear, fishing equipment, and a surprisingly well-curated selection of paperback novels that Kowalchuk personally orders. "People are always surprised by the book section," she says. "Just because we\'re remote doesn\'t mean we don\'t read."',
      ),
      h2('Adapting to Change'),
      p(
        "Kowalchuk credits the Chamber's small business programs with helping her navigate the shift to online ordering and local delivery. \"Margaret [Fenn, Chamber ED] connected me with a logistics consultant who helped me set up an ordering system that actually works with our shipping realities. I'm not competing with Amazon — I'm serving the people Amazon can't reach.\"",
      ),
      p(
        'The Trading Post also serves as an informal community gathering point, hosting a weekly coffee morning that regularly draws fifteen to twenty locals. "Some mornings we get other visitors too," Kowalchuk notes, gesturing toward the reinforced front door. "They\'re less interested in the coffee."',
      ),
      h2('Chamber Membership'),
      p(
        'Kowalchuk has been a Chamber member since taking over the business and currently sits on the Economic Development Committee. "The Chamber is the connective tissue of this community," she says. "Every business up here is too small to advocate for itself. Together, through the Chamber, we actually get heard in Thunder Bay and Toronto."',
      ),
      p(
        'Hudson Bay Trading Post is located at 14 Shoreline Road and is open Monday through Saturday, 8 AM to 6 PM. Visit their profile in the Chamber Member Directory for more information.',
      ),
    ),
    meta: {
      title: 'Member Spotlight: Hudson Bay Trading Post — Southern Hudson Bay Chamber',
      description:
        "From fur trade outpost to community hub — how the Bay's oldest continuously operating business keeps evolving.",
      image: heroImage.id,
    },
  }
}
