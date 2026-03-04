'use client'

import React, { useState, useCallback, useTransition } from 'react'
import Link from 'next/link'

import './index.scss'

// ── Types ──────────────────────────────────────────────────────────────────

export type MemberRow = {
  id: number
  contactId: number
  contactName: string
  contactEmail: string | null
  contactType: 'person' | 'organization'
  organizationName: string | null
  tierName: string | null
  tierId: number | null
  status: 'pending' | 'active' | 'lapsed' | 'cancelled' | 'reinstated'
  renewalDate: string | null
  joinedDate: string | null
  isOverdue: boolean
}

export type TierOption = {
  id: number
  name: string
}

export type CRMStats = {
  total: number
  active: number
  lapsed: number
  cancelled: number
  pending: number
  overdue: number
}

type Props = {
  initialMembers: MemberRow[]
  stats: CRMStats
  tiers: TierOption[]
}

// ── Labels ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<MemberRow['status'], string> = {
  pending: 'Pending',
  active: 'Active',
  lapsed: 'Lapsed',
  cancelled: 'Cancelled',
  reinstated: 'Reinstated',
}

// ── Debounce helper ────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * CRM search + member list client component.
 *
 * Renders stat cards, a search/filter bar, and the member table.
 * Debounces the search query and calls /api/admin/crm-search for results
 * when the query or filters change. Falls back to the server-rendered
 * initial list when search is empty.
 */
export function CRMSearch({ initialMembers, stats, tiers }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [searchResults, setSearchResults] = useState<MemberRow[] | null>(null)
  const [isPending, startTransition] = useTransition()

  const debouncedSearch = useDebounce(search, 350)

  const fetchResults = useCallback(
    async (q: string, status: string, tier: string) => {
      if (!q && status === 'all' && tier === 'all') {
        setSearchResults(null)
        return
      }
      startTransition(async () => {
        try {
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          if (status !== 'all') params.set('status', status)
          if (tier !== 'all') params.set('tier', tier)

          const res = await fetch(`/api/admin/crm-search?${params.toString()}`)
          if (res.ok) {
            const data = (await res.json()) as { members: MemberRow[] }
            setSearchResults(data.members)
          }
        } catch {
          // fail silently — stale results are better than an error state
        }
      })
    },
    [],
  )

  React.useEffect(() => {
    void fetchResults(debouncedSearch, statusFilter, tierFilter)
  }, [debouncedSearch, statusFilter, tierFilter, fetchResults])

  const displayMembers = searchResults ?? initialMembers
  const isFiltered = !!search || statusFilter !== 'all' || tierFilter !== 'all'
  const now = new Date().toISOString()

  return (
    <div className="crm-dashboard">
      {/* ── Header ── */}
      <div className="crm-dashboard__header">
        <div>
          <h1 className="crm-dashboard__title">CRM Dashboard</h1>
          <p className="crm-dashboard__subtitle">{stats.total} contacts in directory</p>
        </div>
        <Link className="btn btn--style-primary btn--size-medium" href="/admin/collections/members/create">
          Add Member
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="crm-dashboard__stats">
        <StatCard label="Active" value={stats.active} variant="active" />
        <StatCard label="Overdue Renewal" value={stats.overdue} variant="warning" />
        <StatCard label="Lapsed" value={stats.lapsed} variant="lapsed" />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Cancelled" value={stats.cancelled} />
      </div>

      {/* ── Filters ── */}
      <div className="crm-dashboard__filters">
        <input
          className="crm-dashboard__search"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or organization…"
          type="search"
          value={search}
        />
        <select
          aria-label="Filter by status"
          className="crm-dashboard__select"
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="lapsed">Lapsed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="reinstated">Reinstated</option>
        </select>
        {tiers.length > 0 && (
          <select
            aria-label="Filter by tier"
            className="crm-dashboard__select"
            onChange={(e) => setTierFilter(e.target.value)}
            value={tierFilter}
          >
            <option value="all">All tiers</option>
            {tiers.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
        )}
        {isPending && <span className="crm-dashboard__loading">Searching…</span>}
      </div>

      {/* ── Member list ── */}
      {displayMembers.length === 0 ? (
        <div className="crm-dashboard__empty">
          {isFiltered ? 'No members match your search.' : 'No members yet.'}
        </div>
      ) : (
        <div className="crm-dashboard__table-wrap">
          <table className="crm-dashboard__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Organization</th>
                <th>Email</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Renewal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((member) => {
                const isOverdue =
                  member.isOverdue ||
                  (member.status === 'active' &&
                    !!member.renewalDate &&
                    member.renewalDate < now)

                return (
                  <tr key={member.id} className={isOverdue ? 'crm-dashboard__row--overdue' : ''}>
                    <td className="crm-dashboard__cell--name">
                      <Link href={`/admin/collections/contacts/${member.contactId}`}>
                        {member.contactName}
                      </Link>
                      {member.contactType === 'organization' && (
                        <span className="crm-dashboard__badge crm-dashboard__badge--org">org</span>
                      )}
                    </td>
                    <td className="crm-dashboard__cell--org">
                      {member.organizationName ? (
                        <span className="crm-dashboard__muted">{member.organizationName}</span>
                      ) : (
                        <span className="crm-dashboard__muted">—</span>
                      )}
                    </td>
                    <td className="crm-dashboard__cell--email">
                      {member.contactEmail ? (
                        <a href={`mailto:${member.contactEmail}`}>{member.contactEmail}</a>
                      ) : (
                        <span className="crm-dashboard__muted">—</span>
                      )}
                    </td>
                    <td>
                      {member.tierName ? (
                        <span className="crm-dashboard__badge crm-dashboard__badge--tier">
                          {member.tierName}
                        </span>
                      ) : (
                        <span className="crm-dashboard__muted">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`crm-dashboard__badge crm-dashboard__badge--status crm-dashboard__badge--status-${member.status}`}
                      >
                        {STATUS_LABELS[member.status]}
                      </span>
                      {isOverdue && (
                        <span className="crm-dashboard__badge crm-dashboard__badge--overdue">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="crm-dashboard__cell--renewal">
                      {member.renewalDate ? (
                        <span className={isOverdue ? 'crm-dashboard__overdue-date' : ''}>
                          {new Date(member.renewalDate).toLocaleDateString('en-CA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="crm-dashboard__muted">—</span>
                      )}
                    </td>
                    <td className="crm-dashboard__cell--actions">
                      <Link
                        className="btn btn--style-secondary btn--size-small"
                        href={`/admin/collections/members/${member.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!isFiltered && (
            <p className="crm-dashboard__hint">
              Showing most recent {displayMembers.length} of {stats.total} members. Use search to
              find specific members.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant?: 'active' | 'warning' | 'lapsed'
}) {
  return (
    <div className={['crm-dashboard__stat', variant ? `crm-dashboard__stat--${variant}` : ''].filter(Boolean).join(' ')}>
      <span className="crm-dashboard__stat-value">{value}</span>
      <span className="crm-dashboard__stat-label">{label}</span>
    </div>
  )
}
