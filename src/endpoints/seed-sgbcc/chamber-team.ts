/**
 * Chamber seed team members — the Board of Directors for the Southern Georgian Bay
 * Chamber of Commerce. Three officers with headshots: a trumpeter swan who has
 * honked his way to the presidency, and two humans who have accepted their fate.
 */

import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'
import { lexicalRoot, p } from '../seed/lexical-helpers'

type TeamDeps = {
  headshot: Media
}

export function boardPresident({ headshot }: TeamDeps): RequiredDataFromCollectionSlug<'team'> {
  return {
    name: 'Sir Honksalot',
    title: 'Board President',
    type: 'board',
    status: 'published',
    displayOrder: 1,
    headshot: headshot.id,
    bio: lexicalRoot(
      p(
        'Sir Honksalot has served as Board President since 2025, following ten years of dedicated volunteer service across several Chamber committees including Tourism & Hospitality, Waterfront Development, and Events Planning. A trumpeter swan who has been a fixture of the Midland waterfront for over a decade, Sir Honksalot brings deep expertise in waterfront resource management, seasonal migration planning, and showing up before anyone else arrives — usually by landing on the roof.',
      ),
      p(
        'Board colleagues describe Sir Honksalot as "commanding," "very present," and "surprisingly effective at building consensus through sheer volume." Under their leadership, Chamber membership has grown 14% and board meetings have become noticeably more efficient — largely because Sir Honksalot deploys a honk of unmistakable finality whenever discussion drifts.',
      ),
    ),
  }
}

export function boardVicePresident({ headshot }: TeamDeps): RequiredDataFromCollectionSlug<'team'> {
  return {
    name: 'Marcus Delacroix',
    title: 'Board Vice President',
    type: 'board',
    status: 'published',
    displayOrder: 2,
    headshot: headshot.id,
    email: 'marcus.delacroix@example.com',
    bio: lexicalRoot(
      p(
        'Marcus Delacroix joined the Chamber board in 2024, bringing twenty years of experience in tourism and hospitality management across Simcoe County. As the general manager of the Georgian Bay Hotel, he has helped position the Midland waterfront as a year-round destination rather than a summer-only stop.',
      ),
      p(
        '"Southern Georgian Bay has everything going for it — the water, the history, the community," Marcus says. "The Chamber gives us the coordinated voice to make sure people know about it before they default to Muskoka."',
      ),
    ),
  }
}

export function boardTreasurer({ headshot }: TeamDeps): RequiredDataFromCollectionSlug<'team'> {
  return {
    name: 'Priya Narayan',
    title: 'Board Treasurer',
    type: 'board',
    status: 'published',
    displayOrder: 3,
    headshot: headshot.id,
    email: 'priya.narayan@example.com',
    bio: lexicalRoot(
      p(
        "Priya Narayan is a partner at Narayan & Associates CPA in Midland and has served as Board Treasurer since 2023. Her financial expertise and meticulous attention to detail keep the Chamber's books in impeccable order. She once caught a $0.23 discrepancy in the annual audit and did not sleep until it was resolved.",
      ),
      p(
        '"Fiscal responsibility isn\'t glamorous," Priya admits. "But try running a Chamber without it. I dare you."',
      ),
    ),
  }
}
