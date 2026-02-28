import type { Metadata } from 'next'

import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import { Media } from '@/components/Media'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { getServerSideURL } from '@/utilities/getURL'
import { TicketCheckout } from '@/components/TicketCheckout'
import { env } from '@/lib/env'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const formatDateRange = (startDate: string, endDate: string): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const events = await payload.find({
    collection: 'events',
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: {
      status: {
        equals: 'published',
      },
    },
    select: {
      slug: true,
    },
  })

  return events.docs.map(({ slug }) => ({ slug }))
}

export default async function EventDetailPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = `/events/${decodedSlug}`
  const event = await queryEventBySlug({ slug: decodedSlug })

  if (!event) return <PayloadRedirects url={url} />

  // Read tax config from site settings for the ticket widget price preview
  const payload = await getPayload({ config: configPromise })
  const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
  const siteTaxRate = (siteSettings as Record<string, unknown>).taxRate as number | undefined
  const siteTaxName = (siteSettings as Record<string, unknown>).taxName as string | undefined

  const featuredImageUrl =
    event.featuredImage && typeof event.featuredImage === 'object' && event.featuredImage.url
      ? event.featuredImage.url
      : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    location: {
      '@type': 'Place',
      name: event.location,
    },
    ...(featuredImageUrl ? { image: [featuredImageUrl] } : {}),
    ...(event.ticketingType === 'external-link' && event.externalTicketUrl
      ? {
          offers: {
            '@type': 'Offer',
            url: event.externalTicketUrl,
          },
        }
      : {}),
  }

  return (
    <article className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PayloadRedirects disableNotFound url={url} />

      <section className="container pt-24 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>
        <p className="text-muted-foreground mb-2">
          {formatDateRange(event.startDate, event.endDate)}
        </p>
        <p className="text-muted-foreground">{event.location}</p>
      </section>

      {event.featuredImage && typeof event.featuredImage === 'object' && (
        <section className="container mb-8">
          <div className="overflow-hidden rounded-xl">
            <Media resource={event.featuredImage} imgClassName="w-full h-auto" />
          </div>
        </section>
      )}

      <section className="container pb-8">
        {(() => {
          const isFreeRegistration = event.ticketingType === 'free-registration'
          const isChamberManaged = event.ticketingType === 'chamber-managed'
          const syntheticTickets = isFreeRegistration
            ? [{ name: 'General Registration', price: 0, capacity: event.registrationCapacity ?? 999999 }]
            : (event.ticketTypes ?? [])
          const showWidget =
            isFreeRegistration || (isChamberManaged && syntheticTickets.length > 0)

          return (
            <div
              className={`grid grid-cols-1 gap-12 items-start ${
                showWidget ? 'lg:grid-cols-[1fr_380px]' : ''
              }`}
            >
              {/* Left column: description + external CTA */}
              <div className={!showWidget ? 'max-w-3xl' : ''}>
                <RichText data={event.description} enableGutter={false} />

                {event.ticketingType === 'external-link' && event.externalTicketUrl && (
                  <div className="mt-8">
                    <Link
                      className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium"
                      href={event.externalTicketUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Get Tickets
                    </Link>
                  </div>
                )}
              </div>

              {/* Right column: ticket / registration widget */}
              {showWidget && (
                <div className="lg:sticky lg:top-24">
                  <TicketCheckout
                    eventId={event.id}
                    eventTitle={event.title}
                    ticketTypes={syntheticTickets}
                    serviceFee={event.serviceFee}
                    stripePublishableKey={env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
                    taxRate={siteTaxRate}
                    taxName={siteTaxName}
                  />
                </div>
              )}
            </div>
          )
        })()}
      </section>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const event = await queryEventBySlug({ slug: decodedSlug })

  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }

  const ogImage =
    event.featuredImage && typeof event.featuredImage === 'object' && event.featuredImage.url
      ? { url: event.featuredImage.url }
      : undefined

  return {
    title: `${event.title} | Events`,
    description: `${event.title} — ${formatDateRange(event.startDate, event.endDate)} at ${event.location}.`,
    openGraph: {
      title: event.title,
      description: `${formatDateRange(event.startDate, event.endDate)} at ${event.location}`,
      type: 'website',
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: {
      canonical: `${getServerSideURL()}/events/${slug}`,
    },
  }
}

const queryEventBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'events',
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  return result.docs?.[0] || null
})
