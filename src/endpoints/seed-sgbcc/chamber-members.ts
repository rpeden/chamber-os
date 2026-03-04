/**
 * Seed data for membership tiers, contacts, and members — SGBCC edition.
 *
 * Creates 4 membership tiers and ~50 members spread across them,
 * with a realistic distribution: most on Silver/Gold, fewer on
 * Bronze and Platinum. Mix of organizations and individuals.
 *
 * Set in Midland, Penetanguishene, Tiny, and Tay — cottage country
 * businesses that run the gamut from marinas to maple syrup.
 */

import type { Payload } from 'payload'

/** Tier definitions matching the SGBCC pricing structure. */
const TIERS = [
  {
    name: 'Bronze',
    annualPrice: 275,
    displayOrder: 1,
    features: [
      'Business listing in member directory',
      'Chamber newsletter subscription',
      'Networking event access',
    ],
  },
  {
    name: 'Silver',
    annualPrice: 550,
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
    annualPrice: 1100,
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
    annualPrice: 2750,
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

interface SeedMember {
  orgName: string
  contactPerson: string
  email: string
  phone: string
  type: 'organization' | 'person'
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  status: 'active' | 'lapsed'
  overdue?: boolean
  city?: string
}

const SEED_MEMBERS: SeedMember[] = [
  // ── Platinum (4) ─────────────────────────────────────
  { orgName: 'Georgian Bay Hotel & Conference Centre', contactPerson: 'Marcus Delacroix', email: 'marcus@georgianbayhotel.ca', phone: '705-526-1001', type: 'organization', tier: 'Platinum', status: 'active', city: 'Midland' },
  { orgName: 'Huronia Insurance Group', contactPerson: 'Catherine Reeves', email: 'catherine@huronia-insurance.ca', phone: '705-526-1002', type: 'organization', tier: 'Platinum', status: 'active', city: 'Midland' },
  { orgName: 'Penetanguishene General Hospital Foundation', contactPerson: 'Dr. Anand Patel', email: 'anand@pghfoundation.ca', phone: '705-549-1003', type: 'organization', tier: 'Platinum', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Bay Marine Services', contactPerson: 'Doug Farnsworth', email: 'doug@baymarine.ca', phone: '705-526-1004', type: 'organization', tier: 'Platinum', status: 'active', city: 'Midland' },

  // ── Gold (12) ────────────────────────────────────────
  { orgName: 'Georgian Bay Outfitters', contactPerson: 'Marie-Claire Dufresne', email: 'mc@georgianbayoutfitters.ca', phone: '705-549-2001', type: 'organization', tier: 'Gold', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Midland Cultural Centre', contactPerson: 'Jennifer Holt', email: 'jennifer@midlandculturalcentre.ca', phone: '705-526-2002', type: 'organization', tier: 'Gold', status: 'active', city: 'Midland' },
  { orgName: 'Discovery Harbour Gift Shop', contactPerson: 'Tamara Whitfield', email: 'tamara@discoveryharbour.ca', phone: '705-526-2003', type: 'organization', tier: 'Gold', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Trumpeter Financial Planning', contactPerson: 'Neil Samson', email: 'neil@trumpeterfinancial.ca', phone: '705-526-2004', type: 'organization', tier: 'Gold', status: 'active', city: 'Midland' },
  { orgName: 'Tay Township Marina', contactPerson: 'Brian Kitchener', email: 'brian@taymarina.ca', phone: '705-534-2005', type: 'organization', tier: 'Gold', status: 'active', city: 'Tay' },
  { orgName: 'Narayan & Associates CPA', contactPerson: 'Priya Narayan', email: 'priya@narayancpa.ca', phone: '705-526-2006', type: 'organization', tier: 'Gold', status: 'active', city: 'Midland' },
  { orgName: 'Explorers Café', contactPerson: 'Sophie Tremblay', email: 'sophie@explorerscafe.ca', phone: '705-526-2007', type: 'organization', tier: 'Gold', status: 'active', city: 'Midland' },
  { orgName: 'Bayfield Construction', contactPerson: 'Mike Rathwell', email: 'mike@bayfieldconstruction.ca', phone: '705-526-2008', type: 'organization', tier: 'Gold', status: 'active', city: 'Midland' },
  { orgName: 'Wye Heritage Marina', contactPerson: 'Dave Moreau', email: 'dave@wyeheritagemarina.ca', phone: '705-526-2009', type: 'organization', tier: 'Gold', status: 'active', city: 'Midland' },
  { orgName: 'Huronia Law LLP', contactPerson: 'Andrea Singh', email: 'andrea@huronialaw.ca', phone: '705-526-2010', type: 'organization', tier: 'Gold', status: 'active', city: 'Midland' },
  { orgName: 'Georgian Bay Brewing Co', contactPerson: 'Tyler Mack', email: 'tyler@gbbrew.ca', phone: '705-526-2011', type: 'organization', tier: 'Gold', status: 'lapsed', city: 'Midland' },
  { orgName: 'Simcoe North Real Estate', contactPerson: 'Amanda Craig', email: 'amanda@simcoenorthre.ca', phone: '705-526-2012', type: 'organization', tier: 'Gold', status: 'active', overdue: true, city: 'Midland' },

  // ── Silver (20) ──────────────────────────────────────
  { orgName: 'Sainte-Marie Gift & Bookshop', contactPerson: 'Renée Lafleur', email: 'renee@smgifts.ca', phone: '705-526-3001', type: 'organization', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Tiny Cottages Vacation Rentals', contactPerson: 'Phil Beattie', email: 'phil@tinycottages.ca', phone: '705-526-3002', type: 'organization', tier: 'Silver', status: 'active', city: 'Tiny' },
  { orgName: 'King Street Bakery', contactPerson: 'Hannah Dwyer', email: 'hannah@kingstreetbakery.ca', phone: '705-526-3003', type: 'organization', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Tay Plumbing & Mechanical', contactPerson: 'Jack Fawcett', email: 'jack@tayplumbing.ca', phone: '705-534-3004', type: 'organization', tier: 'Silver', status: 'active', city: 'Tay' },
  { orgName: 'Penetang Pharmacy', contactPerson: 'Deepak Sharma', email: 'deepak@penetangpharmacy.ca', phone: '705-549-3005', type: 'organization', tier: 'Silver', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Midland Physiotherapy', contactPerson: 'Karen O\'Brien', email: 'karen@midlandphysio.ca', phone: '705-526-3006', type: 'organization', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Georgian Bay Dental', contactPerson: 'Dr. Lisa Chen', email: 'lisa@gbdental.ca', phone: '705-526-3007', type: 'organization', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Huronia Freight & Courier', contactPerson: 'Rob Makela', email: 'rob@huroniafreight.ca', phone: '705-526-3008', type: 'organization', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Bayshore IT Solutions', contactPerson: 'Steven Ng', email: 'steven@bayshoreit.ca', phone: '705-526-3009', type: 'organization', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'North Simcoe Crafts Co-op', contactPerson: 'Theresa Beaudoin', email: 'theresa@northsimcoecrafts.ca', phone: '705-549-3010', type: 'organization', tier: 'Silver', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Waterview B&B', contactPerson: 'Paul Leblanc', email: 'paul@waterviewbb.ca', phone: '705-526-3011', type: 'organization', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Tiny Trails Maple Syrup', contactPerson: 'Julia Henderson', email: 'julia@tinytrailsmaple.ca', phone: '705-526-3012', type: 'organization', tier: 'Silver', status: 'lapsed', city: 'Tiny' },
  { orgName: 'Bay Cleaning Solutions', contactPerson: 'Ruth Campbell', email: 'ruth@baycleaning.ca', phone: '705-526-3013', type: 'organization', tier: 'Silver', status: 'active', overdue: true, city: 'Midland' },
  { orgName: 'Penetang Print & Signs', contactPerson: 'Mark Arsenault', email: 'mark@penetangprint.ca', phone: '705-549-3014', type: 'organization', tier: 'Silver', status: 'active', overdue: true, city: 'Penetanguishene' },
  // Individual Silver members
  { orgName: 'Constance Beaumont-Wright', contactPerson: 'Constance Beaumont-Wright', email: 'constance@beaumont-wright.ca', phone: '705-526-3015', type: 'person', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Dr. Michael Fournier', contactPerson: 'Dr. Michael Fournier', email: 'michael.fournier@gmail.com', phone: '705-549-3016', type: 'person', tier: 'Silver', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Linda Gagnon', contactPerson: 'Linda Gagnon', email: 'linda.gagnon@outlook.com', phone: '705-526-3017', type: 'person', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Raymond Tessier', contactPerson: 'Raymond Tessier', email: 'raymond.tessier@proton.me', phone: '705-534-3018', type: 'person', tier: 'Silver', status: 'lapsed', city: 'Tay' },
  { orgName: 'Agnes Corbett', contactPerson: 'Agnes Corbett', email: 'agnes.corbett@yahoo.ca', phone: '705-526-3019', type: 'person', tier: 'Silver', status: 'active', city: 'Midland' },
  { orgName: 'Daniel McTavish', contactPerson: 'Daniel McTavish', email: 'daniel.m@baymail.ca', phone: '705-549-3020', type: 'person', tier: 'Silver', status: 'active', city: 'Penetanguishene' },

  // ── Bronze (14) ──────────────────────────────────────
  { orgName: 'Katie\'s Hair Studio', contactPerson: 'Katie Morrison', email: 'katie@katieshair.ca', phone: '705-526-4001', type: 'organization', tier: 'Bronze', status: 'active', city: 'Midland' },
  { orgName: 'Penetang Convenience', contactPerson: 'Albert Dubois', email: 'albert@penetangconvenience.ca', phone: '705-549-4002', type: 'organization', tier: 'Bronze', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Pawsitive Pets', contactPerson: 'Carol Newman', email: 'carol@pawsitivepets.ca', phone: '705-526-4003', type: 'organization', tier: 'Bronze', status: 'active', city: 'Midland' },
  { orgName: 'Bay Taxi', contactPerson: 'Ronald Lefebvre', email: 'ronald@baytaxi.ca', phone: '705-526-4004', type: 'organization', tier: 'Bronze', status: 'active', city: 'Midland' },
  { orgName: 'Midland Laundromat', contactPerson: 'Donna Fletcher', email: 'donna@midlandlaundry.ca', phone: '705-526-4005', type: 'organization', tier: 'Bronze', status: 'lapsed', city: 'Midland' },
  { orgName: 'Tiny Beach Fish Co', contactPerson: 'Victor Pelletier', email: 'victor@tinybeachfish.ca', phone: '705-526-4006', type: 'organization', tier: 'Bronze', status: 'active', overdue: true, city: 'Tiny' },
  { orgName: 'North Simcoe Quilters Guild', contactPerson: 'Doris Campbell', email: 'doris@nsqg.ca', phone: '705-549-4007', type: 'organization', tier: 'Bronze', status: 'active', city: 'Penetanguishene' },
  { orgName: 'Bay Boat Rentals', contactPerson: 'Terry Rathwell', email: 'terry@bayboatrentals.ca', phone: '705-526-4008', type: 'organization', tier: 'Bronze', status: 'active', city: 'Midland' },
  // Individual Bronze members
  { orgName: 'Harold Fraser', contactPerson: 'Harold Fraser', email: 'harold.fraser@baymail.ca', phone: '705-534-4009', type: 'person', tier: 'Bronze', status: 'active', city: 'Tay' },
  { orgName: 'Shirley Lemieux', contactPerson: 'Shirley Lemieux', email: 'shirley.lemieux@gmail.com', phone: '705-526-4010', type: 'person', tier: 'Bronze', status: 'active', city: 'Midland' },
  { orgName: 'George Richardson', contactPerson: 'George Richardson', email: 'george.richardson@outlook.com', phone: '705-526-4011', type: 'person', tier: 'Bronze', status: 'active', city: 'Midland' },
  { orgName: 'Evelyn St-Pierre', contactPerson: 'Evelyn St-Pierre', email: 'evelyn.stpierre@yahoo.ca', phone: '705-549-4012', type: 'person', tier: 'Bronze', status: 'active', overdue: true, city: 'Penetanguishene' },
  { orgName: 'Leonard Carpenter', contactPerson: 'Leonard Carpenter', email: 'leonard.carpenter@proton.me', phone: '705-526-4013', type: 'person', tier: 'Bronze', status: 'lapsed', city: 'Midland' },
  { orgName: 'Frances Moore', contactPerson: 'Frances Moore', email: 'frances.moore@baymail.ca', phone: '705-526-4014', type: 'person', tier: 'Bronze', status: 'active', city: 'Midland' },
]

/**
 * Seed membership tiers, contacts, and members.
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

  const tierIdMap = Object.fromEntries(tierDocs.map((doc) => [doc.name, doc.id]))

  payload.logger.info('— Creating contacts and members...')

  const nextRenewal = '2027-01-01'
  const overdueDate = '2026-01-01'
  const lapsedDate = '2025-01-01'

  for (const member of SEED_MEMBERS) {
    if (member.type === 'organization') {
      const orgContact = await payload.create({
        collection: 'contacts',
        data: {
          name: member.orgName,
          email: member.email,
          phone: member.phone,
          type: 'organization',
          address: {
            city: member.city ?? 'Midland',
            province: 'ON',
          },
        },
      })

      const personContact = await payload.create({
        collection: 'contacts',
        data: {
          name: member.contactPerson,
          email: member.email,
          type: 'person',
          organization: orgContact.id,
        },
      })

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
      const personContact = await payload.create({
        collection: 'contacts',
        data: {
          name: member.contactPerson,
          email: member.email,
          phone: member.phone,
          type: 'person',
          address: {
            city: member.city ?? 'Midland',
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
