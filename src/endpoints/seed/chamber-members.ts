/**
 * Seed data for membership tiers, contacts, and members.
 *
 * Creates 4 membership tiers and ~50 members spread across them,
 * with a realistic distribution: most on Silver/Gold, fewer on
 * Bronze and Platinum. Mix of organizations and individuals.
 *
 * Some members are lapsed or have overdue renewals to populate
 * the dashboard health indicators.
 */

import type { Payload } from 'payload'

/** Tier definitions matching the SHBCC pricing structure. */
const TIERS = [
  {
    name: 'Bronze',
    annualPrice: 250,
    displayOrder: 1,
    features: [
      'Business listing in member directory',
      'Chamber newsletter subscription',
      'Networking event access',
    ],
  },
  {
    name: 'Silver',
    annualPrice: 500,
    displayOrder: 2,
    features: [
      'Everything in Bronze',
      'Logo on Chamber website',
      'Social media promotion (quarterly)',
      'Committee participation',
    ],
  },
  {
    name: 'Gold',
    annualPrice: 1000,
    displayOrder: 3,
    features: [
      'Everything in Silver',
      'Priority event sponsorship',
      'Monthly social media features',
      'Board meeting observer access',
      'Annual economic report',
    ],
  },
  {
    name: 'Platinum',
    annualPrice: 2500,
    displayOrder: 4,
    features: [
      'Everything in Gold',
      'Premier event naming rights',
      'Dedicated Chamber liaison',
      'Featured speaker opportunities',
      'Custom marketing partnership',
      'Seat on advisory council',
    ],
  },
]

/**
 * Fictional Northern Ontario businesses and individuals.
 * type: 'organization' entries get a primary contact person linked to them.
 * type: 'person' entries are individual members.
 */
interface SeedMember {
  orgName: string
  contactPerson: string
  email: string
  phone: string
  type: 'organization' | 'person'
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  status: 'active' | 'lapsed'
  /** If true, renewal date is in the past (overdue). */
  overdue?: boolean
  city?: string
}

const SEED_MEMBERS: SeedMember[] = [
  // ── Platinum (4) ─────────────────────────────────────
  { orgName: 'Northern Resource Development Corp', contactPerson: 'James Whitebear', email: 'james@nrdc.ca', phone: '705-336-1001', type: 'organization', tier: 'Platinum', status: 'active', city: 'Moosonee' },
  { orgName: 'Moosonee Power & Utilities', contactPerson: 'Sarah Chakasim', email: 'sarah@moosoneepower.ca', phone: '705-336-1002', type: 'organization', tier: 'Platinum', status: 'active', city: 'Moosonee' },
  { orgName: 'Hudson Bay Mining Co', contactPerson: 'Robert Koostachin', email: 'robert@hbmining.ca', phone: '705-336-1003', type: 'organization', tier: 'Platinum', status: 'active', city: 'Moose Factory' },
  { orgName: 'Bay Transport & Logistics', contactPerson: 'Margaret Sutherland', email: 'margaret@baytransport.ca', phone: '705-336-1004', type: 'organization', tier: 'Platinum', status: 'active', city: 'Moosonee' },

  // ── Gold (12) ────────────────────────────────────────
  { orgName: 'Polar Bear Lodge & Outfitters', contactPerson: 'Thomas Hookimaw', email: 'thomas@polarbearlodge.ca', phone: '705-336-2001', type: 'organization', tier: 'Gold', status: 'active', city: 'Moosonee' },
  { orgName: 'Northern Building Supplies', contactPerson: 'Diane Fletcher', email: 'diane@northernbuilding.ca', phone: '705-336-2002', type: 'organization', tier: 'Gold', status: 'active', city: 'Moosonee' },
  { orgName: 'Moosonee General Store', contactPerson: 'Peter Nakogee', email: 'peter@moosoneegeneralstore.ca', phone: '705-336-2003', type: 'organization', tier: 'Gold', status: 'active', city: 'Moosonee' },
  { orgName: 'Tidewater Aviation', contactPerson: 'Laura Visitor', email: 'laura@tidewateraviation.ca', phone: '705-336-2004', type: 'organization', tier: 'Gold', status: 'active', city: 'Moosonee' },
  { orgName: 'Revillon Frères Heritage Centre', contactPerson: 'André Lemieux', email: 'andre@revillonheritage.ca', phone: '705-336-2005', type: 'organization', tier: 'Gold', status: 'active', city: 'Moose Factory' },
  { orgName: 'Cree Village Eco-Lodge', contactPerson: 'William Wesley', email: 'william@creevillage.ca', phone: '705-336-2006', type: 'organization', tier: 'Gold', status: 'active', city: 'Moose Factory' },
  { orgName: 'Northern Tire & Auto', contactPerson: 'Kevin Linklater', email: 'kevin@northerntire.ca', phone: '705-336-2007', type: 'organization', tier: 'Gold', status: 'active', city: 'Moosonee' },
  { orgName: 'Bay Accounting & Tax', contactPerson: 'Helen Cheechoo', email: 'helen@bayaccounting.ca', phone: '705-336-2008', type: 'organization', tier: 'Gold', status: 'active', city: 'Moosonee' },
  { orgName: 'Mushkegowuk Environmental Services', contactPerson: 'Frank Kapashesit', email: 'frank@mushkegowukenv.ca', phone: '705-336-2009', type: 'organization', tier: 'Gold', status: 'active', city: 'Moose Factory' },
  { orgName: 'James Bay Wilderness Tours', contactPerson: 'Nancy Loutit', email: 'nancy@jamesbaytoures.ca', phone: '705-336-2010', type: 'organization', tier: 'Gold', status: 'active', city: 'Moosonee' },
  { orgName: 'Moosonee Hardware & Lumber', contactPerson: 'Gary Reuben', email: 'gary@moosoneehardware.ca', phone: '705-336-2011', type: 'organization', tier: 'Gold', status: 'lapsed', city: 'Moosonee' },
  { orgName: 'Northern Legal Services', contactPerson: 'Brenda Solomon', email: 'brenda@northernlegal.ca', phone: '705-336-2012', type: 'organization', tier: 'Gold', status: 'active', overdue: true, city: 'Moosonee' },

  // ── Silver (20) ──────────────────────────────────────
  { orgName: 'Moose Cree First Nation Enterprises', contactPerson: 'Donald Cheechoo', email: 'donald@mcfne.ca', phone: '705-336-3001', type: 'organization', tier: 'Silver', status: 'active', city: 'Moose Factory' },
  { orgName: 'Twin Rivers Country Store', contactPerson: 'Alice Sutherland', email: 'alice@twinrivers.ca', phone: '705-336-3002', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Northern Lights Diner', contactPerson: 'Rose Patterson', email: 'rose@northernlightsdiner.ca', phone: '705-336-3003', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Bay Plumbing & Heating', contactPerson: 'Jack Wynne', email: 'jack@bayplumbing.ca', phone: '705-336-3004', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Coastal Pharmacy', contactPerson: 'Marilyn Tomatuk', email: 'marilyn@coastalpharmacy.ca', phone: '705-336-3005', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'J.M. Small Engine Repair', contactPerson: 'Jason Morrison', email: 'jason@jmsmallengine.ca', phone: '705-336-3006', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Moosonee Dental Clinic', contactPerson: 'Dr. Patricia Bird', email: 'patricia@moosoneidental.ca', phone: '705-336-3007', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Timmins-Moosonee Freight', contactPerson: 'Brian Edwards', email: 'brian@tmfreight.ca', phone: '705-336-3008', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Arctic Wireless', contactPerson: 'Steven Hunter', email: 'steven@arcticwireless.ca', phone: '705-336-3009', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'North Country Crafts', contactPerson: 'Theresa Wheesk', email: 'theresa@northcountrycrafts.ca', phone: '705-336-3010', type: 'organization', tier: 'Silver', status: 'active', city: 'Moose Factory' },
  { orgName: 'Riverside Motel', contactPerson: 'Paul Friday', email: 'paul@riversidemotel.ca', phone: '705-336-3011', type: 'organization', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Moose Factory Canoe Co', contactPerson: 'Julia Nakogee', email: 'julia@mfcanoe.ca', phone: '705-336-3012', type: 'organization', tier: 'Silver', status: 'lapsed', city: 'Moose Factory' },
  { orgName: 'Bay Cleaning Services', contactPerson: 'Ruth Chakasim', email: 'ruth@baycleaning.ca', phone: '705-336-3013', type: 'organization', tier: 'Silver', status: 'active', overdue: true, city: 'Moosonee' },
  { orgName: 'Northern Printing & Signs', contactPerson: 'Mark Archibald', email: 'mark@northernprinting.ca', phone: '705-336-3014', type: 'organization', tier: 'Silver', status: 'active', overdue: true, city: 'Moosonee' },
  // Individual Silver members
  { orgName: 'Constance Hookimaw-Witt', contactPerson: 'Constance Hookimaw-Witt', email: 'constance@hookimawwitt.ca', phone: '705-336-3015', type: 'person', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Dr. Michael Faries', contactPerson: 'Dr. Michael Faries', email: 'michael.faries@gmail.com', phone: '705-336-3016', type: 'person', tier: 'Silver', status: 'active', city: 'Moose Factory' },
  { orgName: 'Linda Gagnon', contactPerson: 'Linda Gagnon', email: 'linda.gagnon@outlook.com', phone: '705-336-3017', type: 'person', tier: 'Silver', status: 'active', city: 'Moosonee' },
  { orgName: 'Raymond Trapper', contactPerson: 'Raymond Trapper', email: 'raymond.trapper@proton.me', phone: '705-336-3018', type: 'person', tier: 'Silver', status: 'lapsed', city: 'Moose Factory' },
  { orgName: 'Agnes Corston', contactPerson: 'Agnes Corston', email: 'agnes.corston@yahoo.ca', phone: '705-336-3019', type: 'person', tier: 'Silver', status: 'active', city: 'Moose Factory' },
  { orgName: 'Daniel Metatawabin', contactPerson: 'Daniel Metatawabin', email: 'daniel.m@northernmail.ca', phone: '705-336-3020', type: 'person', tier: 'Silver', status: 'active', city: 'Moose Factory' },

  // ── Bronze (14) ──────────────────────────────────────
  { orgName: 'Katie\'s Hair Studio', contactPerson: 'Katie Morrison', email: 'katie@katieshair.ca', phone: '705-336-4001', type: 'organization', tier: 'Bronze', status: 'active', city: 'Moosonee' },
  { orgName: 'Moose Factory Convenience', contactPerson: 'Albert Cheechoo', email: 'albert@mfconvenience.ca', phone: '705-336-4002', type: 'organization', tier: 'Bronze', status: 'active', city: 'Moose Factory' },
  { orgName: 'Northern Pet Supplies', contactPerson: 'Carol Blueboy', email: 'carol@northernpets.ca', phone: '705-336-4003', type: 'organization', tier: 'Bronze', status: 'active', city: 'Moosonee' },
  { orgName: 'Bay Taxi', contactPerson: 'Ronald Linklater', email: 'ronald@baytaxi.ca', phone: '705-336-4004', type: 'organization', tier: 'Bronze', status: 'active', city: 'Moosonee' },
  { orgName: 'Moosonee Laundromat', contactPerson: 'Donna Fletcher', email: 'donna@moosoneelaundry.ca', phone: '705-336-4005', type: 'organization', tier: 'Bronze', status: 'lapsed', city: 'Moosonee' },
  { orgName: 'Frozen River Fish Co', contactPerson: 'Victor Kapashesit', email: 'victor@frozenriverfish.ca', phone: '705-336-4006', type: 'organization', tier: 'Bronze', status: 'active', overdue: true, city: 'Moose Factory' },
  { orgName: 'Northern Sewing Circle', contactPerson: 'Doris Wesley', email: 'doris@northernsewing.ca', phone: '705-336-4007', type: 'organization', tier: 'Bronze', status: 'active', city: 'Moose Factory' },
  { orgName: 'Bay Snowmobile Rentals', contactPerson: 'Terry Reuben', email: 'terry@baysnowmobile.ca', phone: '705-336-4008', type: 'organization', tier: 'Bronze', status: 'active', city: 'Moosonee' },
  // Individual Bronze members
  { orgName: 'Harold Frog', contactPerson: 'Harold Frog', email: 'harold.frog@northernmail.ca', phone: '705-336-4009', type: 'person', tier: 'Bronze', status: 'active', city: 'Moose Factory' },
  { orgName: 'Shirley Louttit', contactPerson: 'Shirley Louttit', email: 'shirley.louttit@gmail.com', phone: '705-336-4010', type: 'person', tier: 'Bronze', status: 'active', city: 'Moosonee' },
  { orgName: 'George Rickard', contactPerson: 'George Rickard', email: 'george.rickard@outlook.com', phone: '705-336-4011', type: 'person', tier: 'Bronze', status: 'active', city: 'Moosonee' },
  { orgName: 'Evelyn Smallboy', contactPerson: 'Evelyn Smallboy', email: 'evelyn.smallboy@yahoo.ca', phone: '705-336-4012', type: 'person', tier: 'Bronze', status: 'active', overdue: true, city: 'Moose Factory' },
  { orgName: 'Leonard Carpenter', contactPerson: 'Leonard Carpenter', email: 'leonard.carpenter@proton.me', phone: '705-336-4013', type: 'person', tier: 'Bronze', status: 'lapsed', city: 'Moosonee' },
  { orgName: 'Frances Moore', contactPerson: 'Frances Moore', email: 'frances.moore@northernmail.ca', phone: '705-336-4014', type: 'person', tier: 'Bronze', status: 'active', city: 'Moosonee' },
]

/**
 * Seed membership tiers, contacts, and members.
 *
 * Creates 4 tiers, then 50 contacts + member records with a realistic
 * mix of statuses and tier distribution.
 */
export async function seedMembers(payload: Payload): Promise<void> {
  payload.logger.info('— Creating membership tiers...')

  const tierDocs = await Promise.all(
    TIERS.map((tier) =>
      payload.create({
        collection: 'membership-tiers',
        data: {
          name: tier.name,
          annualPrice: tier.annualPrice,
          displayOrder: tier.displayOrder,
          features: tier.features.map((f) => ({ feature: f })),
        },
      }),
    ),
  )

  // Build a lookup: tier name → tier document ID
  const tierIdMap = Object.fromEntries(tierDocs.map((doc) => [doc.name, doc.id]))

  payload.logger.info('— Creating contacts and members...')

  // Renewal dates: most are Jan 1 of next year (upcoming).
  // "overdue" members have a renewal date in the past.
  const nextRenewal = '2027-01-01'
  const overdueDate = '2026-01-01' // Should have renewed but didn't
  const lapsedDate = '2025-01-01'

  for (const member of SEED_MEMBERS) {
    if (member.type === 'organization') {
      // Step 1: Create the organization contact
      const orgContact = await payload.create({
        collection: 'contacts',
        data: {
          name: member.orgName,
          email: member.email,
          phone: member.phone,
          type: 'organization',
          address: {
            city: member.city ?? 'Moosonee',
            province: 'ON',
          },
        },
      })

      // Step 2: Create the primary contact person linked to the org
      const personContact = await payload.create({
        collection: 'contacts',
        data: {
          name: member.contactPerson,
          email: member.email,
          type: 'person',
          organization: orgContact.id,
        },
      })

      // Step 3: Create the member record
      let renewalDate = nextRenewal
      if (member.status === 'lapsed') renewalDate = lapsedDate
      else if (member.overdue) renewalDate = overdueDate

      await payload.create({
        collection: 'members',
        data: {
          contact: orgContact.id,
          primaryContact: personContact.id,
          membershipTier: tierIdMap[member.tier],
          status: member.status,
          joinedDate: '2024-01-15',
          renewalDate,
        },
      })
    } else {
      // Individual member: one person contact, no org
      const personContact = await payload.create({
        collection: 'contacts',
        data: {
          name: member.contactPerson,
          email: member.email,
          phone: member.phone,
          type: 'person',
          address: {
            city: member.city ?? 'Moosonee',
            province: 'ON',
          },
        },
      })

      let renewalDate = nextRenewal
      if (member.status === 'lapsed') renewalDate = lapsedDate
      else if (member.overdue) renewalDate = overdueDate

      await payload.create({
        collection: 'members',
        data: {
          contact: personContact.id,
          membershipTier: tierIdMap[member.tier],
          status: member.status,
          joinedDate: '2024-01-15',
          renewalDate,
        },
      })
    }
  }

  payload.logger.info(`— Created ${SEED_MEMBERS.length} members across ${TIERS.length} tiers`)
}
