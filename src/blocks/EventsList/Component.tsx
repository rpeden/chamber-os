import React from 'react'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import { BlockWrapper } from '@/components/BlockWrapper'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'

import type { EventsListBlock as EventsListBlockProps } from '@/payload-types'

/**
 * Formats a date for the event date badge (e.g., "MAR\n15").
 */
function formatDateBadge(dateString: string): { month: string; day: string } {
  const date = new Date(dateString)
  return {
    month: date.toLocaleDateString('en-CA', { month: 'short' }).toUpperCase(),
    day: date.toLocaleDateString('en-CA', { day: 'numeric' }),
  }
}

/**
 * Formats a human-readable date range string.
 */
function formatDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`
}

/**
 * Events List block — a dynamic, data-fetching server component that queries
 * the Events collection and renders event cards with date badges and image backgrounds.
 *
 * This block runs its own Payload Local API query at render time. The display mode
 * determines the query filter (featured, upcoming, or all published events).
 */
export const EventsListBlock: React.FC<EventsListBlockProps> = async ({
  sectionHeading,
  introText,
  displayMode,
  maxItems,
  enableViewAllLink,
  viewAllLink,
  background,
}) => {
  const payload = await getPayload({ config: configPromise })
  const nowIso = new Date().toISOString()

  const mode = displayMode ?? 'upcoming'
  const limit = maxItems ?? 3

  // Build the where clause based on display mode
  const whereConditions: Where[] = [{ status: { equals: 'published' } }]

  if (mode === 'featured') {
    whereConditions.push({ isFeatured: { equals: true } })
    whereConditions.push({ endDate: { greater_than_equal: nowIso } })
  } else if (mode === 'upcoming') {
    whereConditions.push({ endDate: { greater_than_equal: nowIso } })
  }

  const events = await payload.find({
    collection: 'events',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: mode === 'all' ? '-startDate' : 'startDate',
    where: { and: whereConditions },
  })

  if (events.docs.length === 0) {
    return null
  }

  return (
    <BlockWrapper background={background}>
      {sectionHeading && <h2 className="text-3xl md:text-4xl font-bold mb-4">{sectionHeading}</h2>}
      {introText && <p className="text-lg text-muted-foreground mb-10 max-w-2xl">{introText}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.docs.map((event) => {
          const badge = formatDateBadge(event.startDate)
          const hasImage = event.featuredImage && typeof event.featuredImage === 'object'

          return (
            <article
              key={event.id}
              className="group relative rounded-lg overflow-hidden border border-border bg-card flex flex-col"
            >
              {/* Image with date badge overlay */}
              <div className="relative aspect-[16/10] bg-muted">
                {hasImage && (
                  <Media
                    resource={event.featuredImage as NonNullable<typeof event.featuredImage>}
                    imgClassName="w-full h-full object-cover"
                  />
                )}
                {/* Date badge */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-md px-3 py-2 text-center shadow-sm">
                  <div className="text-xs font-bold tracking-wider text-theme-primary">
                    {badge.month}
                  </div>
                  <div className="text-2xl font-bold leading-none text-gray-900">{badge.day}</div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="text-xl font-semibold mb-2 leading-tight">
                  <Link
                    href={`/events/${event.slug}`}
                    className="hover:underline after:absolute after:inset-0"
                  >
                    {event.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {formatDateRange(event.startDate, event.endDate)}
                </p>
                <p className="text-sm text-muted-foreground mb-2">{event.location}</p>
                {event.isChambersEvent && (
                  <span className="text-xs uppercase tracking-wide font-medium text-theme-primary mt-auto">
                    Chamber Event
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {enableViewAllLink && viewAllLink && (
        <div className="mt-8 text-center">
          <CMSLink {...viewAllLink} appearance="default" />
        </div>
      )}
    </BlockWrapper>
  )
}
