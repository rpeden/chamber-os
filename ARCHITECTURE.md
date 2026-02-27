# Chamber OS — Architecture Decisions

**Status:** Ratified before Phase 9  
**Last updated:** 2026-02-26  
**Context:** See `hold-the-fuck-up.md` for the concerns that prompted these decisions.

This document records binding architectural decisions for Chamber OS. Any developer or LLM agent working on Phases 7+ **must read this before writing code**. These are not suggestions — they are load-bearing decisions that prevent us from building ourselves into a corner.

---

## ADR-1: Payload Collections as Storage + Admin UI Layer

### Decision

All domain entities — including Contacts, Members, Orders, Membership Tiers — are stored as **Payload collections**. We do not maintain a parallel set of hand-written Drizzle schemas or raw SQL tables for these entities.

### Rationale

Payload collections generate standard relational tables via Drizzle. The `events` table, for example, is a normal table with typed columns, foreign keys, and indexes — exactly what you'd design by hand. On top of that, Payload gives us:

- Admin CRUD UI (list, edit, search, filter) for free
- Typed Local API (`payload.find()`, `payload.create()`, etc.)
- Auto-generated TypeScript types (`payload-types.ts`)
- Access control (per-collection, per-field, per-operation)
- REST + GraphQL API
- Versioning and drafts
- Hook lifecycle for guardrails

Rolling our own tables would mean rebuilding all of this for zero gain. The tables are identical either way.

### Escape hatch

When Payload's Local API can't express a query (complex joins, aggregations, CTEs, reporting), access the Drizzle instance directly via `payload.db.drizzle`. Same connection pool, same transaction context. Fully typed. You're never locked out of the database.

### What this does NOT mean

Payload collections being the storage layer does **not** mean Payload hooks are the application layer. See ADR-3.

---

## ADR-2: Contacts and Members Are Separate Concepts

### Decision

**Contact** and **Member** are distinct entities, modeled as separate Payload collections with a relationship between them.

### Definitions

- **Contact** — Any person or organization the Chamber has a reason to track. Members, but also: mayors, MPPs, event speakers, venue contacts, vendors, sponsors, media contacts, potential members being courted. A Contact can exist without ever becoming a Member.

- **Member** — A Contact (or Organization) with an active or historical **membership relationship**. A Member record represents the business relationship: tier, lifecycle status, dues, renewal date, portal access. A Member always points to a Contact. The membership is a relationship *on top of* the contact, not the contact itself.

### Collection structure

```
contacts
  id, name, email, phone, address
  type: person | organization
  organization_id (self-ref, for linking people to their org)
  tags (array — e.g., "vendor", "municipal", "media", "prospect")
  notes (rich text)
  social links, website

members
  id
  contact_id → contacts (required — the entity that IS the member, org or person)
  primary_contact_id → contacts (optional — the go-to human for this membership,
                                  used when the member is an org)
  membership_tier_id → membership_tiers
  status: pending | active | lapsed | cancelled | reinstated
  renewal_date
  joined_date
  stripe_customer_id (optional)
  xero_contact_id (optional — Xero's Contact ID for accounting sync)
  notes (rich text, internal)

membership_tiers
  id, name, annual_price, features, display_order, stripe_price_id
```

### Member types

**Organization member (typical):** `contact_id` → an org Contact. `primary_contact_id` → the main person at that org. Other people at the org are linked via their own Contact records (with `organization_id` pointing to the org). The org is what appears in the member directory and what syncs to Xero.

**Individual member (less common):** `contact_id` → a person Contact directly. `primary_contact_id` is null. Admin gets a "New Individual Member" shortcut that creates the person Contact + Member record in one step.

### External system linkage

`xero_contact_id` lives on the **Member**, not the Contact. The Member is the billable entity — the thing that maps to a Xero Contact (customer). Whether it's an org or person, the Member record is what syncs. This keeps CRM contact data (which is ours) cleanly separated from accounting system references (which are Xero's).

### Why this split matters

1. **CRM needs contacts beyond members.** A Chamber tracks the mayor, their event venue manager, and the local newspaper editor. None of these are members. Forcing them into a "members" collection with a "non-member" status is data modeling malpractice.

2. **Membership is a lifecycle, not an identity.** A contact's name, email, and phone number don't change when their membership lapses. The membership status changes. These are different concerns with different update frequencies and different access patterns.

3. **Members can be orgs or individuals.** The same model handles both — the `contact_id` points to whatever entity holds the membership. The `primary_contact_id` provides the human touchpoint when the member is an org. No separate "org members" vs "individual members" collections needed.

4. **The member portal authenticates against the Contact, not the Member.** A person logs in. Whether they (or their org) currently have an active membership determines what they can *do*, not whether they can *exist*.

---

## ADR-3: Business Logic Lives in a Service Layer, Not in Hooks

### Decision

Core business workflows live in explicitly coded service functions under `src/lib/`. Payload hooks are **thin wrappers** that call into services — never the reverse. Hooks handle guardrails and light enrichment only.

### The rule

| Belongs in hooks | Belongs in services |
|---|---|
| Slug generation | Membership lifecycle transitions |
| Setting `publishedAt` on first publish | Order state machine (pending → confirmed → refunded) |
| Populating computed fields | Stripe Payment Intent creation |
| Revalidation / cache busting | Fee calculation |
| Input sanitization | Onboarding workflows |
| Copying template defaults | Renewal processing |
| | Email notifications |
| | Audit log creation |
| | QR code generation |

### Pattern

```typescript
// src/lib/members/membership-service.ts
export class MembershipService {
  constructor(private readonly payload: Payload) {}

  async activate(contactId: string, tierId: string, req: PayloadRequest): Promise<Member> {
    // Validate preconditions
    // Update member status
    // Create audit log entry
    // Trigger Stripe subscription if applicable
    // Send welcome email
    // Return result
  }
}

// In collection hook (thin wrapper):
afterChange: [
  async ({ doc, req, operation, previousDoc, context }) => {
    if (context.skipServiceCall) return doc
    if (operation === 'update' && doc.status === 'active' && previousDoc.status !== 'active') {
      const service = new MembershipService(req.payload)
      await service.onActivated(doc, req)
    }
    return doc
  }
]
```

### Why

- Services are independently testable. Hooks are not (they require the full Payload lifecycle).
- Services have explicit inputs, outputs, and error types. Hooks have implicit control flow and invisible ordering.
- Services compose. Hooks nest into recursive trigger hellscapes.
- When you're debugging "why did this member's status change?", you can read the service function top-to-bottom. With hooks, you're grepping across five files trying to reconstruct an invisible call chain.

### Non-negotiable rules

1. **No business logic exclusively in hooks.** If it's important enough to test, it lives in a service.
2. **Hooks always pass `req`** to nested Payload operations (transaction safety).
3. **Hooks use `context` flags** to prevent infinite loops.
4. **Services never import from collection configs.** Data flows one way: config → hook → service.

---

## ADR-4: Service Layer Directory Convention

### Structure

```
src/lib/
  members/
    membership-service.ts       ← State transitions, lifecycle management
    membership-service.test.ts  ← Colocated tests
    onboarding-service.ts       ← Staff-assisted and self-serve onboarding
    onboarding-service.test.ts
  orders/
    order-service.ts            ← Order creation, status transitions
    order-service.test.ts
    fee-calculator.ts           ← Pure function: calculates service fees
    fee-calculator.test.ts
  stripe/
    client.ts                   ← Stripe SDK initialization
    payment-intent.ts           ← Payment Intent creation
    webhook-handler.ts          ← Webhook event processing
    webhook-handler.test.ts
  contacts/
    contact-service.ts          ← Contact CRUD enrichment, dedup logic
  email/
    email-service.ts            ← Transactional email dispatch
  audit/
    audit-service.ts            ← Event logging for critical transitions
    audit-service.test.ts
```

### Conventions

- **One service per bounded context**, not one service per collection. `MembershipService` handles Member lifecycle — it doesn't care that the data happens to live in a Payload collection.
- **Pure functions extracted for testability.** `fee-calculator.ts` is a pure function with zero dependencies. It gets its own file and its own tests.
- **Tests are colocated**, not in a separate `__tests__/` directory.
- **Services receive `Payload` (or `PayloadRequest`) via constructor or function argument.** No global imports, no singletons.

---

## ADR-5: Authentication — Two Systems, One Database

### Decision

- **Payload auth** → Admin panel (staff, editors, admins)
- **NextAuth/AuthJS** → Member portal (members, public users)

These are separate auth systems with separate sessions, separate login flows, and separate UI. They share the same database.

### Why two systems

Staff logging into the admin panel and a Chamber member checking their renewal date are fundamentally different user journeys with different security requirements, different session lifetimes, and different UI. Trying to unify them into one auth system means compromising both.

### Identity model

The member portal authenticates against the **Contacts** collection (a person logs in). The session includes the Contact ID. Portal code then queries the **Members** collection to determine what the logged-in contact can do (active membership? which tier? renewal status?).

```
Portal login → NextAuth session → Contact ID
                                    ↓
                              Members collection query
                                    ↓
                              "active member, Gold tier, renewal in 30 days"
                                    ↓
                              Render portal accordingly
```

A Contact with no active membership can still log in (to update their profile, view event history, etc.). Membership status determines **authorization**, not **authentication**.

### Shared authorization policy

Access rules — "can this user see this resource?" — are defined as shared utility functions in `src/access/`, not duplicated across Payload access control and Next.js middleware. Both systems import from the same definitions.

```typescript
// src/access/membership.ts
export function isActiveMember(contact: Contact, members: Member[]): boolean {
  return members.some(m =>
    m.contact === contact.id && m.status === 'active'
  )
}

// Used in Payload access control AND Next.js middleware
```

---

## ADR-6: Order State Machine with Explicit Transitions

### Decision

Orders follow an explicit state machine. Status transitions happen through the service layer with validation, not through raw field updates.

### States and transitions

```
                ┌──────────┐
                │ pending   │ ← Created when Payment Intent is created
                └────┬─────┘
                     │ payment_intent.succeeded webhook
                     ▼
                ┌──────────┐
                │ confirmed │ ← QR token generated, confirmation email sent
                └────┬─────┘
                     │ staff action or API call
                     ▼
                ┌──────────┐
                │ refunded  │ ← Stripe refund processed
                └──────────┘
```

### Rules

- **No direct status field updates in the admin UI** for Orders. Status changes go through `OrderService` methods that enforce preconditions and side effects.
- **Idempotent webhook processing.** The webhook handler checks `stripePaymentIntentId` for duplicates before creating/updating orders. Stripe retries must not create duplicate orders.
- **Every transition is logged** in the audit trail (who, when, from-state, to-state, reason).

---

## ADR-7: Audit Logging for Critical Transitions

### Decision

All critical state transitions get an explicit audit log entry. This is a separate collection (or direct DB table), not a Payload version history entry.

### What gets logged

- Member status changes (pending → active, active → lapsed, etc.)
- Order status changes
- Payment events (intent created, succeeded, failed, refunded)
- Membership tier changes
- Manual overrides by staff (with staff user ID)

### Schema

```
audit_log
  id
  entity_type: 'member' | 'order' | 'payment' | 'contact'
  entity_id
  action: string (e.g., 'status_changed', 'tier_upgraded')
  from_state (optional)
  to_state (optional)
  actor_id (who did this — staff user ID, system, webhook)
  actor_type: 'staff' | 'member' | 'system' | 'webhook'
  metadata (JSON — additional context)
  timestamp
```

### Implementation

Audit logging is a **Payload collection** (for admin visibility and querying), but writes go through `AuditService` — never directly. The audit collection is append-only in practice (no update/delete access for anyone except system maintenance).

---

## ADR-8: Bounded Contexts

### Declared contexts and ownership

| Context | Source of truth | Admin interface | Public interface |
|---|---|---|---|
| **CMS Content** | Payload collections (Pages, Posts, Media, Categories) | Payload admin (standard CRUD) | Next.js frontend (SSR/SSG) |
| **Site Config** | Payload globals (Site Settings, Header, Footer) | Payload admin | Theme injection, nav rendering |
| **Events** | Payload collection (Events, Event Templates) | Payload admin + Events Manager custom view | Event listing/detail pages |
| **Contacts & CRM** | Payload collection (Contacts) | Payload admin + CRM Dashboard custom view | Member directory (filtered) |
| **Membership** | Payload collection (Members, Membership Tiers) + service layer | CRM Dashboard custom view | Member portal |
| **Commerce** | Payload collection (Orders) + service layer | Orders Dashboard custom view | Checkout flow, confirmation |
| **Payments** | Stripe (source of truth for payment state) + service layer | Orders Dashboard | Stripe Elements checkout |
| **Identity (staff)** | Payload Users collection | Payload auth | N/A |
| **Identity (members)** | Contacts collection + NextAuth | N/A | Member portal auth |
| **Community/Governance** | TBD (future) | TBD | TBD |

### Cross-context rules

- Collections within a context can freely reference each other.
- Cross-context references use relationship fields (foreign keys), never data duplication.
- Business logic that spans contexts (e.g., "checkout creates an Order and optionally links a Member") lives in the service layer, not in collection hooks.

---

## Summary of Non-Negotiable Implementation Rules

These apply to all code written in Phases 7+:

1. **No core business logic exclusively in hooks.** Hooks call services.
2. **Every service function is independently testable.** No test requires the full Payload lifecycle to run.
3. **Idempotent webhook processing** with explicit deduplication keys.
4. **Explicit state transitions** for Members and Orders — no raw field updates for status.
5. **Audit log entry for every critical transition.** No silent state changes.
6. **Shared authorization policy** between admin and portal — defined once, imported everywhere.
7. **Always pass `req` to nested Payload operations** in hooks (transaction safety).
8. **Always use `context` flags** to prevent infinite hook loops.
9. **`overrideAccess: false`** whenever passing `user` to the Local API.
10. **Contacts and Members are separate collections.** A Contact exists independently of membership.
