import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { CRMSearch } from './CRMSearch'
import type { MemberRow, TierOption } from './CRMSearch'
import type { Contact, MembershipTier } from '@/payload-types'

/**
 * CRM Dashboard — custom admin view at /admin/crm.
 *
 * Displays membership health stats and a searchable/filterable member list.
 * Server component fetches initial stats and first 50 members; the client
 * component handles search and filtering via /api/admin/crm-search.
 */
export default async function CRMDashboardView(props: AdminViewServerProps) {
  const { initPageResult, i18n, payload: payloadInstance, permissions, user } = props
  const { visibleEntities, req } = initPageResult
  const payload = req.payload
  const now = new Date().toISOString()

  // ── Stats ─────────────────────────────────────────────────────────────────

  const [active, lapsed, cancelled, pending, overdue, total] = await Promise.all([
    payload.count({ collection: 'members', where: { status: { equals: 'active' } } }),
    payload.count({ collection: 'members', where: { status: { equals: 'lapsed' } } }),
    payload.count({ collection: 'members', where: { status: { equals: 'cancelled' } } }),
    payload.count({ collection: 'members', where: { status: { equals: 'pending' } } }),
    payload.count({
      collection: 'members',
      where: { and: [{ status: { equals: 'active' } }, { renewalDate: { less_than: now } }] },
    }),
    payload.count({ collection: 'members', where: {} }),
  ])

  const stats = {
    total: total.totalDocs,
    active: active.totalDocs,
    lapsed: lapsed.totalDocs,
    cancelled: cancelled.totalDocs,
    pending: pending.totalDocs,
    overdue: overdue.totalDocs,
  }

  // ── Initial member list (first 50, sorted by renewal date) ───────────────

  const membersResult = await payload.find({
    collection: 'members',
    limit: 50,
    sort: 'renewalDate',
    depth: 2,
    select: {
      contact: true,
      primaryContact: true,
      membershipTier: true,
      status: true,
      renewalDate: true,
      joinedDate: true,
    },
  })

  const initialMembers: MemberRow[] = membersResult.docs.map((m) => {
    const contact = m.contact as Contact
    const org =
      contact.type === 'person' && contact.organization
        ? (contact.organization as Contact)
        : null
    const tier = m.membershipTier as MembershipTier | null | undefined

    return {
      id: m.id,
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email ?? null,
      contactType: contact.type,
      organizationName: org?.name ?? null,
      tierName: tier?.name ?? null,
      tierId: tier?.id ?? null,
      status: m.status,
      renewalDate: m.renewalDate ?? null,
      joinedDate: m.joinedDate ?? null,
      isOverdue: m.status === 'active' && !!m.renewalDate && m.renewalDate < now,
    }
  })

  // ── Tier options for filter dropdown ─────────────────────────────────────

  const tiersResult = await payload.find({
    collection: 'membership-tiers',
    limit: 50,
    select: { name: true },
    depth: 0,
  })

  const tiers: TierOption[] = tiersResult.docs.map((t) => ({ id: t.id, name: t.name }))

  return (
    <DefaultTemplate
      visibleEntities={visibleEntities}
      i18n={i18n}
      payload={payloadInstance}
      permissions={permissions}
      user={user}
    >
      <Gutter>
        <CRMSearch initialMembers={initialMembers} stats={stats} tiers={tiers} />
      </Gutter>
    </DefaultTemplate>
  )
}
