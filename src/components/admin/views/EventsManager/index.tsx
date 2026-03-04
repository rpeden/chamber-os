import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { EventsManagerClient } from './EventsManagerClient'
import type { EventRow, OrderStats, TemplateOption } from './EventsManagerClient'

/**
 * Events Manager — custom admin view at /admin/events-manager.
 *
 * Provides a single-screen overview of all events with at-a-glance ticket
 * sales data, quick-action buttons (Edit, Duplicate), and filters for
 * upcoming/past events, status, and search.
 *
 * Server component: fetches events + aggregate order counts, passes to
 * EventsManagerClient for interactive rendering.
 */
export default async function EventsManagerView(props: AdminViewServerProps) {
  const { initPageResult, i18n, payload: payloadInstance, permissions, user } = props
  const { visibleEntities, req } = initPageResult
  const payload = req.payload

  // ── Events ────────────────────────────────────────────────────────────────

  const eventsResult = await payload.find({
    collection: 'events',
    limit: 200,
    sort: '-startDate',
    select: {
      title: true,
      slug: true,
      startDate: true,
      endDate: true,
      location: true,
      status: true,
      ticketingType: true,
      ticketTypes: true,
      registrationCapacity: true,
    },
    depth: 0,
  })

  const eventRows: EventRow[] = eventsResult.docs.map((event) => {
    let totalCapacity: number | null = null
    if (event.ticketingType === 'free-registration') {
      totalCapacity = event.registrationCapacity ?? null
    } else if (event.ticketingType === 'chamber-managed' && event.ticketTypes?.length) {
      totalCapacity = event.ticketTypes.reduce((sum, t) => sum + (t.capacity ?? 0), 0)
    }
    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      status: event.status,
      ticketingType: event.ticketingType,
      totalCapacity,
    }
  })

  // ── Order counts (single query, then group in-memory) ─────────────────────

  const eventIds = eventsResult.docs.map((e) => e.id)
  const orderStatsByEvent: Record<string, OrderStats> = {}

  if (eventIds.length > 0) {
    const ordersResult = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { event: { in: eventIds } },
          { status: { in: ['confirmed', 'pending'] } },
        ],
      },
      limit: 2000,
      select: { event: true, status: true, quantity: true },
      depth: 0,
    })

    for (const order of ordersResult.docs) {
      const eid = String(typeof order.event === 'object' ? order.event.id : order.event)
      if (!orderStatsByEvent[eid]) {
        orderStatsByEvent[eid] = { confirmed: 0, pending: 0, total: 0 }
      }
      const qty = order.quantity ?? 1
      orderStatsByEvent[eid].total += qty
      if (order.status === 'confirmed') {
        orderStatsByEvent[eid].confirmed += qty
      } else {
        orderStatsByEvent[eid].pending += qty
      }
    }
  }

  // ── Event templates (for "Create from Template") ───────────────────────────

  const templatesResult = await payload.find({
    collection: 'event-templates',
    limit: 50,
    depth: 0,
  })

  const templates: TemplateOption[] = templatesResult.docs.map((t) => ({
    id: t.id,
    name: t.seriesName,
  }))

  return (
    <DefaultTemplate
      visibleEntities={visibleEntities}
      i18n={i18n}
      payload={payloadInstance}
      permissions={permissions}
      user={user}
    >
      <Gutter>
        <EventsManagerClient
          events={eventRows}
          orderStats={orderStatsByEvent}
          templates={templates}
        />
      </Gutter>
    </DefaultTemplate>
  )
}
