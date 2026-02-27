import React from 'react'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'

import './index.scss'

const baseClass = 'chamber-dashboard'

/**
 * Chamber OS admin dashboard panel.
 *
 * Server Component rendered above the default Payload collection list.
 * Shows at-a-glance stats, upcoming events, recent news, and quick-action links.
 *
 * Members/Orders stats will be wired in when those collections ship (Phase 9).
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

  const [upcomingEvents, recentPosts, eventCount, postCount, pageCount] = await Promise.all([
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
  ])

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

      {/* Content panels */}
      <div className={`${baseClass}__panels`}>
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
