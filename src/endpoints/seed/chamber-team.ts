/**
 * Chamber seed team members — the Board of Directors for the Southern Hudson Bay
 * Chamber of Commerce. Three officers with headshots: a ringed seal who has
 * risen through the ranks to the presidency, and two humans who seem fine with it.
 */

import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'
import { lexicalRoot, p } from './lexical-helpers'

type TeamDeps = {
  headshot: Media
}

export function boardPresident({ headshot }: TeamDeps): RequiredDataFromCollectionSlug<'team'> {
  return {
    name: 'Natsiq',
    title: 'Board President',
    type: 'board',
    status: 'published',
    displayOrder: 1,
    headshot: headshot.id,
    bio: lexicalRoot(
      p(
        'Natsiq has served as Board President since 2025, following ten years of dedicated volunteer service across several Chamber committees including Membership & Engagement, Economic Development, and Events Planning. A ringed seal who has been a fixture of the Hudson Bay shoreline community for over a decade, Natsiq brings deep expertise in marine resource management, seasonal adaptation, and showing up before anyone else arrives.',
      ),
      p(
        'Board colleagues describe Natsiq as "attentive," "very present," and "surprisingly effective at building consensus." Under their leadership, Chamber membership has grown 15% and board meetings have become noticeably more efficient — largely because Natsiq does not tolerate tangents.',
      ),
    ),
  }
}

export function boardVicePresident({ headshot }: TeamDeps): RequiredDataFromCollectionSlug<'team'> {
  return {
    name: 'Raymond Singh',
    title: 'Board Vice President',
    type: 'board',
    status: 'published',
    displayOrder: 2,
    headshot: headshot.id,
    email: 'raymond.singh@example.com',
    bio: lexicalRoot(
      p(
        'Raymond Singh joined the Chamber board in 2024, bringing two decades of experience in northern logistics and supply chain management. As the founder of Singh Arctic Freight, he has built a business that keeps goods moving even when the weather and the wildlife conspire otherwise.',
      ),
      p(
        '"Up here, reliable logistics isn\'t a convenience — it\'s survival," Raymond says. "The Chamber gives us the collective voice to advocate for the infrastructure this region needs."',
      ),
    ),
  }
}

export function boardTreasurer({ headshot }: TeamDeps): RequiredDataFromCollectionSlug<'team'> {
  return {
    name: 'Robert Jones',
    title: 'Board Treasurer',
    type: 'board',
    status: 'published',
    displayOrder: 3,
    headshot: headshot.id,
    email: 'robert.jones@example.com',
    bio: lexicalRoot(
      p(
        "Robert Jones is the branch manager of Northern Lights Credit Union and has served as Board Treasurer since 2022. His financial expertise and meticulous attention to detail keep the Chamber's books in impeccable order. He once caught a $0.17 discrepancy in the annual audit and did not sleep until it was resolved.",
      ),
      p(
        '"Fiscal responsibility isn\'t glamorous," Robert admits. "But try running a Chamber without it."',
      ),
    ),
  }
}
