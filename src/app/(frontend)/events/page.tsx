import type { Metadata } from 'next'

import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { Media } from '@/components/Media'

type Args = {
  searchParams: Promise<{
    chamber?: string
    view?: string
  }>
}

const formatDateRange = (startDate: string, endDate: string): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`
}

export const dynamic = 'force-static'
export const revalidate = 600

export default async function EventsPage({ searchParams: searchParamsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const searchParams = await searchParamsPromise

  const view =
    searchParams.view === 'past' || searchParams.view === 'all' ? searchParams.view : 'upcoming'
  const chamberOnly = searchParams.chamber === '1'

  const nowIso = new Date().toISOString()

  const statusClause = {
    status: {
      equals: 'published',
    },
  }

  const viewClause =
    view === 'past'
      ? [{ endDate: { less_than: nowIso } }]
      : view === 'upcoming'
        ? [{ endDate: { greater_than_equal: nowIso } }]
        : []

  const chamberClause = chamberOnly
    ? [
        {
          isChambersEvent: {
            equals: true,
          },
        },
      ]
    : []

  const events = await payload.find({
    collection: 'events',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    sort: view === 'past' ? '-startDate' : 'startDate',
    where: {
      and: [statusClause, ...viewClause, ...chamberClause],
    },
  })

  const makeFilterHref = ({
    nextView,
    nextChamberOnly,
  }: {
    nextView: string
    nextChamberOnly: boolean
  }) => {
    const params = new URLSearchParams()

    if (nextView !== 'upcoming') params.set('view', nextView)
    if (nextChamberOnly) params.set('chamber', '1')

    const query = params.toString()
    return query ? `/events?${query}` : '/events'
  }

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Events</h1>
        <p className="text-muted-foreground mb-6">Browse upcoming and past events.</p>

        <div className="flex flex-wrap gap-3">
          <Link
            className="px-4 py-2 rounded-md border border-border"
            href={makeFilterHref({ nextView: 'upcoming', nextChamberOnly: chamberOnly })}
          >
            Upcoming
          </Link>
          <Link
            className="px-4 py-2 rounded-md border border-border"
            href={makeFilterHref({ nextView: 'past', nextChamberOnly: chamberOnly })}
          >
            Past
          </Link>
          <Link
            className="px-4 py-2 rounded-md border border-border"
            href={makeFilterHref({ nextView: 'all', nextChamberOnly: chamberOnly })}
          >
            All
          </Link>
          <Link
            className="px-4 py-2 rounded-md border border-border"
            href={makeFilterHref({ nextView: view, nextChamberOnly: !chamberOnly })}
          >
            {chamberOnly ? 'Show All Organizers' : 'Only Chamber Events'}
          </Link>
        </div>
      </div>

      <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.docs.map((event) => (
          <article
            className="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
            key={event.id}
          >
            {event.featuredImage && typeof event.featuredImage === 'object' && (
              <div className="aspect-video">
                <Media resource={event.featuredImage} imgClassName="h-full w-full object-cover" />
              </div>
            )}

            <div className="p-5 flex flex-col gap-3">
              <h2 className="text-2xl font-semibold leading-tight">
                <Link className="hover:underline" href={`/events/${event.slug}`}>
                  {event.title}
                </Link>
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatDateRange(event.startDate, event.endDate)}
              </p>
              <p className="text-sm text-muted-foreground">{event.location}</p>
              <p className="text-xs uppercase tracking-wide text-theme-primary">
                {event.isChambersEvent ? 'Chamber Event' : 'Community Event'}
              </p>
            </div>
          </article>
        ))}

        {events.docs.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No events match the selected filters.
          </p>
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Events',
    description: 'Browse upcoming and past chamber and community events.',
  }
}
