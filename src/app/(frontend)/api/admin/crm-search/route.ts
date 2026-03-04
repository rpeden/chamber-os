import { getPayload } from 'payload'
import config from '@payload-config'
import type { NextRequest } from 'next/server'
import type { Contact, MembershipTier } from '@/payload-types'
import type { MemberRow } from '@/components/admin/views/CRMDashboard/CRMSearch'

/**
 * GET /api/admin/crm-search?q=&status=&tier=
 *
 * Authenticated search across the member + contact directory.
 *
 * - `q` — searches contact name and email (case-insensitive contains)
 * - `status` — filters by member status
 * - `tier` — filters by membership tier ID
 *
 * Returns: { members: MemberRow[] }
 */
export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const status = searchParams.get('status') ?? ''
  const tier = searchParams.get('tier') ?? ''
  const now = new Date().toISOString()

  // Build the member where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberWhere: Record<string, any> = {}
  const andClauses = []

  // Status filter
  if (status && status !== 'all') {
    andClauses.push({ status: { equals: status } })
  }

  // Tier filter
  if (tier && tier !== 'all') {
    andClauses.push({ membershipTier: { equals: Number(tier) } })
  }

  // Text search — find matching contacts first, then filter members by those IDs
  if (q) {
    const contactsResult = await payload.find({
      collection: 'contacts',
      where: {
        or: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      limit: 200,
      select: { name: true, email: true },
      depth: 0,
    })

    const contactIds = contactsResult.docs.map((c) => c.id)

    if (contactIds.length === 0) {
      return Response.json({ members: [] })
    }

    andClauses.push({ contact: { in: contactIds } })
  }

  if (andClauses.length > 0) {
    memberWhere['and'] = andClauses
  }

  const membersResult = await payload.find({
    collection: 'members',
    where: Object.keys(memberWhere).length > 0 ? memberWhere : {},
    limit: 100,
    sort: 'renewalDate',
    depth: 2,
    select: {
      contact: true,
      membershipTier: true,
      status: true,
      renewalDate: true,
      joinedDate: true,
    },
  })

  const members: MemberRow[] = membersResult.docs.map((m) => {
    const contact = m.contact as Contact
    const org =
      contact.type === 'person' && contact.organization
        ? (contact.organization as Contact)
        : null
    const memberTier = m.membershipTier as MembershipTier | null | undefined

    return {
      id: m.id,
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email ?? null,
      contactType: contact.type,
      organizationName: org?.name ?? null,
      tierName: memberTier?.name ?? null,
      tierId: memberTier?.id ?? null,
      status: m.status,
      renewalDate: m.renewalDate ?? null,
      joinedDate: m.joinedDate ?? null,
      isOverdue: m.status === 'active' && !!m.renewalDate && m.renewalDate < now,
    }
  })

  return Response.json({ members })
}
