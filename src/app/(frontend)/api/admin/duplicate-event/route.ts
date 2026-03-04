import { getPayload } from 'payload'
import config from '@payload-config'
import type { NextRequest } from 'next/server'
import type { Event } from '@/payload-types'

/**
 * POST /api/admin/duplicate-event
 *
 * Creates a draft copy of an existing event, including all ticket types and
 * service fee settings. Dates are cleared so the organiser must set new ones.
 * Returns the new event's ID so the client can redirect to the edit view.
 *
 * Body: { eventId: number }
 * Response: { newEventId: number }
 */
export async function POST(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config })

  // Auth check
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let eventId: number
  try {
    const body = (await req.json()) as { eventId?: unknown }
    if (typeof body.eventId !== 'number') {
      return Response.json({ error: 'eventId must be a number' }, { status: 400 })
    }
    eventId = body.eventId
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Fetch source event
  const source = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
    overrideAccess: false,
    user,
  })

  if (!source) {
    return Response.json({ error: 'Event not found' }, { status: 404 })
  }

  // Copy all fields except identity. Dates are copied from the source so the
  // document is immediately valid; the organiser updates them before publishing.
  const newEvent = await payload.create({
    collection: 'events',
    draft: false,
    data: {
      title: `Copy of ${source.title}`,
      description: source.description,
      location: source.location,
      startDate: source.startDate,
      endDate: source.endDate,
      featuredImage:
        typeof source.featuredImage === 'object' ? source.featuredImage?.id : source.featuredImage,
      isFeatured: false, // copies shouldn't auto-feature
      isChambersEvent: source.isChambersEvent ?? true,
      status: 'draft',
      ticketingType: source.ticketingType,
      externalTicketUrl: source.externalTicketUrl,
      registrationCapacity: source.registrationCapacity,
      ticketTypes: source.ticketTypes?.map(({ id: _id, ...rest }) => rest) ?? [],
      serviceFee: source.serviceFee,
      slug: `${source.slug}-copy-${Date.now()}`,
      // Link to same template if present
      eventTemplate:
        typeof source.eventTemplate === 'object'
          ? (source.eventTemplate as NonNullable<Event['eventTemplate']> & { id: number })?.id
          : source.eventTemplate,
    },
    overrideAccess: false,
    user,
  })

  return Response.json({ newEventId: newEvent.id }, { status: 201 })
}
