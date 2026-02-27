import React from 'react'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'
import { MemberOnboardingPanel } from './MemberOnboardingPanel'

import './index.scss'

const baseClass = 'chamber-dashboard'

/**
 * Chamber OS admin dashboard panel.
 *
 * Server Component rendered above the default Payload collection list.
 * Shows at-a-glance stats (content + membership), upcoming events,
 * recent news, membership health breakdown, and quick-action links.
 */
const BeforeDashboard: React.FC = async () => {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()

  const upcomingEventsFilter: Where = {
    and: [
      { status: { equals: 'published' } },
      { endDate: { greater_than_equal: now } },
    ],
  }

  const publishedPostsFilter: Where = { _status: { equals: 'published' } }
  const publishedPagesFilter: Where = { _status: { equals: 'published' } }

  // Member status filters
  const activeMembersFilter: Where = { status: { equals: 'active' } }
  const lapsedMembersFilter: Where = { status: { equals: 'lapsed' } }
  const overdueFilter: Where = {
    and: [
      { status: { equals: 'active' } },
      { renewalDate: { less_than: now } },
    ],
  }

  const [
    upcomingEvents,
    recentPosts,
    eventCount,
    postCount,
    pageCount,
    activeCount,
    lapsedCount,
    overdueCount,
    tierBreakdown,
    organizationContacts,
    personContacts,
  ] = await Promise.all([
    payload.find({
      collection: 'events',
      limit: 5,
      sort: 'startDate',
      where: upcomingEventsFilter,
      select: {
        title: true,
        slug: true,
        startDate: true,
        location: true,
      },
      depth: 0,
    }),
    payload.find({
      collection: 'posts',
      limit: 5,
      sort: '-createdAt',
      where: publishedPostsFilter,
      select: {
        title: true,
        slug: true,
        createdAt: true,
      },
      depth: 0,
    }),
    payload.count({
      collection: 'events',
      where: upcomingEventsFilter,
    }),
    payload.count({
      collection: 'posts',
      where: publishedPostsFilter,
    }),
    payload.count({
      collection: 'pages',
      where: publishedPagesFilter,
    }),
    payload.count({
      collection: 'members',
      where: activeMembersFilter,
    }),
    payload.count({
      collection: 'members',
      where: lapsedMembersFilter,
    }),
    payload.count({
      collection: 'members',
      where: overdueFilter,
    }),
    // Fetch all tiers + count active members per tier
    payload.find({
      collection: 'membership-tiers',
      sort: 'displayOrder',
      limit: 20,
      select: { name: true },
      depth: 0,
    }),
    payload.find({
      collection: 'contacts',
      sort: 'name',
      limit: 200,
      where: { type: { equals: 'organization' } },
      select: { name: true },
      depth: 0,
    }),
    payload.find({
      collection: 'contacts',
      sort: 'name',
      limit: 300,
      where: { type: { equals: 'person' } },
      select: { name: true },
      depth: 0,
    }),
  ])

  // Count active members per tier (parallel)
  const tierCounts = await Promise.all(
    tierBreakdown.docs.map(async (tier) => {
      const count = await payload.count({
        collection: 'members',
        where: {
          and: [
            { status: { equals: 'active' } },
            { membershipTier: { equals: tier.id } },
          ],
        },
      })
      return { name: tier.name, count: count.totalDocs }
    }),
  )

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso))

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h2>Chamber OS</h2>
        <p className={`${baseClass}__subtitle`}>Your admin dashboard</p>
      </div>

      {/* At-a-glance stats */}
      <div className={`${baseClass}__stats`}>
        <a href="/admin/collections/members" className={`${baseClass}__stat`}>
          <span className={`${baseClass}__stat-value`}>{activeCount.totalDocs}</span>
          <span className={`${baseClass}__stat-label`}>Active Members</span>
        </a>
        {overdueCount.totalDocs > 0 && (
          <a
            href={`/admin/collections/members?where[and][0][status][equals]=active&where[and][1][renewalDate][less_than]=${encodeURIComponent(now)}`}
            className={`${baseClass}__stat ${baseClass}__stat--warning`}
          >
            <span className={`${baseClass}__stat-value`}>{overdueCount.totalDocs}</span>
            <span className={`${baseClass}__stat-label`}>Overdue</span>
          </a>
        )}
        {lapsedCount.totalDocs > 0 && (
          <a href="/admin/collections/members?where[status][equals]=lapsed" className={`${baseClass}__stat ${baseClass}__stat--muted`}>
            <span className={`${baseClass}__stat-value`}>{lapsedCount.totalDocs}</span>
            <span className={`${baseClass}__stat-label`}>Lapsed</span>
          </a>
        )}
        <a href="/admin/collections/events" className={`${baseClass}__stat`}>
          <span className={`${baseClass}__stat-value`}>{eventCount.totalDocs}</span>
          <span className={`${baseClass}__stat-label`}>Upcoming Events</span>
        </a>
        <a href="/admin/collections/posts" className={`${baseClass}__stat`}>
          <span className={`${baseClass}__stat-value`}>{postCount.totalDocs}</span>
          <span className={`${baseClass}__stat-label`}>Published Posts</span>
        </a>
        <a href="/admin/collections/pages" className={`${baseClass}__stat`}>
          <span className={`${baseClass}__stat-value`}>{pageCount.totalDocs}</span>
          <span className={`${baseClass}__stat-label`}>Published Pages</span>
        </a>
      </div>

      {/* Quick actions */}
      <div className={`${baseClass}__actions`}>
        <a href="/admin/collections/members/create" className={`${baseClass}__action`}>
          + New Member
        </a>
        <a href="/admin/collections/events/create" className={`${baseClass}__action`}>
          + New Event
        </a>
        <a href="/admin/collections/posts/create" className={`${baseClass}__action`}>
          + New Post
        </a>
        <a href="/admin/collections/pages/create" className={`${baseClass}__action`}>
          + New Page
        </a>
      </div>

      <MemberOnboardingPanel
        tiers={tierBreakdown.docs.map((tier) => ({ id: tier.id, name: tier.name }))}
        organizations={organizationContacts.docs.map((contact) => ({
          id: contact.id,
          name: contact.name,
        }))}
        people={personContacts.docs.map((contact) => ({ id: contact.id, name: contact.name }))}
      />

      {/* Content panels */}
      <div className={`${baseClass}__panels`}>
        {/* Membership by Tier panel */}
        {tierCounts.length > 0 && (
          <div className={`${baseClass}__panel`}>
            <div className={`${baseClass}__panel-header`}>
              <h3>Members by Tier</h3>
              <a href="/admin/collections/members" className={`${baseClass}__view-all`}>
                View All →
              </a>
            </div>
            <ul className={`${baseClass}__list`}>
              {tierCounts.map((tier) => (
                <li key={tier.name} className={`${baseClass}__list-item`}>
                  <a href={`/admin/collections/members`}>
                    <span className={`${baseClass}__list-title`}>{tier.name}</span>
                    <span className={`${baseClass}__tier-count`}>{tier.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upcoming Events panel */}
        <div className={`${baseClass}__panel`}>
          <div className={`${baseClass}__panel-header`}>
            <h3>Upcoming Events</h3>
            <a href="/admin/collections/events" className={`${baseClass}__view-all`}>
              View All →
            </a>
          </div>
          {upcomingEvents.docs.length === 0 ? (
            <p className={`${baseClass}__empty`}>No upcoming events.</p>
          ) : (
            <ul className={`${baseClass}__list`}>
              {upcomingEvents.docs.map((event) => (
                <li key={event.id} className={`${baseClass}__list-item`}>
                  <a href={`/admin/collections/events/${event.id}`}>
                    <span className={`${baseClass}__list-title`}>{event.title}</span>
                    <span className={`${baseClass}__list-meta`}>
                      {formatDate(event.startDate)}
                      {event.location ? ` · ${event.location}` : ''}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent News panel */}
        <div className={`${baseClass}__panel`}>
          <div className={`${baseClass}__panel-header`}>
            <h3>Recent News</h3>
            <a href="/admin/collections/posts" className={`${baseClass}__view-all`}>
              View All →
            </a>
          </div>
          {recentPosts.docs.length === 0 ? (
            <p className={`${baseClass}__empty`}>No published posts yet.</p>
          ) : (
            <ul className={`${baseClass}__list`}>
              {recentPosts.docs.map((post) => (
                <li key={post.id} className={`${baseClass}__list-item`}>
                  <a href={`/admin/collections/posts/${post.id}`}>
                    <span className={`${baseClass}__list-title`}>{post.title}</span>
                    <span className={`${baseClass}__list-meta`}>{formatDate(post.createdAt)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default BeforeDashboard
