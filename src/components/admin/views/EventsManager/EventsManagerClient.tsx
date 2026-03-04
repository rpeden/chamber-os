'use client'

import React, { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import './index.scss'

// ── Types ──────────────────────────────────────────────────────────────────

export type EventRow = {
  id: number
  title: string
  slug: string
  startDate: string
  endDate: string
  location: string
  status: 'draft' | 'published' | 'cancelled'
  ticketingType: 'none' | 'free-registration' | 'external-link' | 'chamber-managed'
  totalCapacity: number | null
}

export type OrderStats = {
  confirmed: number
  pending: number
  total: number
}

export type TemplateOption = {
  id: number
  name: string
}

type Props = {
  events: EventRow[]
  orderStats: Record<string, OrderStats>
  templates: TemplateOption[]
}

type TimeFilter = 'upcoming' | 'past' | 'all'

// ── Labels ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<EventRow['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
}

const TICKETING_LABELS: Record<EventRow['ticketingType'], string> = {
  none: 'No Ticketing',
  'free-registration': 'Free Reg.',
  'external-link': 'External',
  'chamber-managed': 'Chamber',
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Interactive events table with filtering, search, and quick actions.
 * Receives serialized event + order data from the server component.
 */
export function EventsManagerClient({ events, orderStats, templates }: Props) {
  const router = useRouter()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [duplicating, setDuplicating] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const now = new Date()

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const startDate = new Date(event.startDate)
      if (timeFilter === 'upcoming' && startDate < now) return false
      if (timeFilter === 'past' && startDate >= now) return false
      if (statusFilter !== 'all' && event.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!event.title.toLowerCase().includes(q) && !event.location.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [events, timeFilter, statusFilter, search])

  const handleDuplicate = async (eventId: number, eventTitle: string) => {
    if (!confirm(`Duplicate "${eventTitle}"? A draft copy will be created for you to edit.`)) return

    setDuplicating(eventId)
    try {
      const res = await fetch('/api/admin/duplicate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        alert(`Failed to duplicate: ${err.error ?? 'Unknown error'}`)
        return
      }
      const { newEventId } = (await res.json()) as { newEventId: number }
      startTransition(() => {
        router.push(`/admin/collections/events/${newEventId}`)
      })
    } catch {
      alert('Failed to duplicate event. Please try again.')
    } finally {
      setDuplicating(null)
    }
  }

  const upcomingCount = events.filter((e) => new Date(e.startDate) >= now).length
  const pastCount = events.length - upcomingCount

  return (
    <div className="events-manager">
      {/* ── Header ── */}
      <div className="events-manager__header">
        <div>
          <h1 className="events-manager__title">Events Manager</h1>
          <p className="events-manager__subtitle">
            {upcomingCount} upcoming · {pastCount} past
          </p>
        </div>
        <div className="events-manager__header-actions">
          {templates.length > 0 && (
            <Link
              className="btn btn--style-secondary btn--size-medium"
              href="/admin/collections/event-templates/create"
            >
              New Template
            </Link>
          )}
          <Link
            className="btn btn--style-primary btn--size-medium"
            href="/admin/collections/events/create"
          >
            New Event
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="events-manager__filters">
        <div className="events-manager__tabs" role="tablist">
          {(['upcoming', 'past', 'all'] as TimeFilter[]).map((t) => (
            <button
              className={[
                'events-manager__tab',
                timeFilter === t ? 'events-manager__tab--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={t}
              onClick={() => setTimeFilter(t)}
              role="tab"
              type="button"
              aria-selected={timeFilter === t}
            >
              {t === 'upcoming' ? 'Upcoming' : t === 'past' ? 'Past' : 'All'}
            </button>
          ))}
        </div>

        <input
          className="events-manager__search"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or location…"
          type="search"
          value={search}
        />

        <select
          className="events-manager__select"
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ── Table ── */}
      {filteredEvents.length === 0 ? (
        <div className="events-manager__empty">
          {search || statusFilter !== 'all'
            ? 'No events match your filters.'
            : timeFilter === 'upcoming'
              ? 'No upcoming events. Create one using the button above!'
              : 'No past events.'}
        </div>
      ) : (
        <div className="events-manager__table-wrap">
          <table className="events-manager__table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Location</th>
                <th>Ticketing</th>
                <th>Sales / Cap.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const stats = orderStats[String(event.id)]
                const confirmed = stats?.confirmed ?? 0
                const pending = stats?.pending ?? 0
                const isDuplicating = duplicating === event.id
                const startDate = new Date(event.startDate)
                const isPast = startDate < now

                return (
                  <tr key={event.id} className={isPast ? 'events-manager__row--past' : ''}>
                    <td className="events-manager__cell--title">
                      <Link href={`/admin/collections/events/${event.id}`}>{event.title}</Link>
                    </td>
                    <td className="events-manager__cell--date">
                      {startDate.toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="events-manager__cell--location">{event.location}</td>
                    <td>
                      <span
                        className={`events-manager__badge events-manager__badge--ticketing events-manager__badge--${event.ticketingType}`}
                      >
                        {TICKETING_LABELS[event.ticketingType]}
                      </span>
                    </td>
                    <td className="events-manager__cell--sales">
                      {event.ticketingType === 'none' ||
                      event.ticketingType === 'external-link' ? (
                        <span className="events-manager__muted">—</span>
                      ) : (
                        <span>
                          {confirmed > 0 || pending > 0 ? (
                            <>
                              <strong>{confirmed}</strong>
                              {pending > 0 && (
                                <span className="events-manager__muted"> +{pending} pend.</span>
                              )}
                            </>
                          ) : (
                            '0'
                          )}
                          <span className="events-manager__muted">
                            {' '}/ {event.totalCapacity != null ? event.totalCapacity : '∞'}
                          </span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`events-manager__badge events-manager__badge--status events-manager__badge--status-${event.status}`}
                      >
                        {STATUS_LABELS[event.status]}
                      </span>
                    </td>
                    <td className="events-manager__cell--actions">
                      <Link
                        className="btn btn--style-secondary btn--size-small"
                        href={`/admin/collections/events/${event.id}`}
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn--style-secondary btn--size-small"
                        disabled={isDuplicating}
                        onClick={() => handleDuplicate(event.id, event.title)}
                        type="button"
                      >
                        {isDuplicating ? '…' : 'Duplicate'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="events-manager__count">
            Showing {filteredEvents.length} of {events.length} event
            {events.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
