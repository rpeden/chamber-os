# Hold the Fuck Up: Architecture Concerns Before We Build Ourselves Into a Corner

## Why this exists

We're building a real ARM/CRM platform, not a glorified CMS with business logic duct-taped onto collection hooks.  
If we model core operational data like website content, we'll move fast for a month and then spend a year untangling coupling, access rules, data integrity bugs, and migration pain.

## Core Concern

Payload collections are excellent for content management and admin CRUD.  
They are not automatically the right **system of record** for every operational domain entity.

If we put everything into collections just because it's convenient, we recreate the "custom post type everything" anti-pattern in modern TypeScript clothes.

## Where the current plan is risky

### 1) Members as CMS docs vs Members as domain accounts

A member is not just profile content. It's identity, auth, role/permissions, lifecycle state, billing/renewal state, and eventually forum/governance participation.

Questions we must answer before implementation:

- Is Payload `users` the canonical identity model, or is NextAuth/AuthJS + app-owned tables canonical?
- What is the stable principal key used everywhere (`userId`, `memberId`, both)?
- How do we model membership lifecycle transitions (pending -> active -> lapsed -> reinstated) with auditability?
- What happens when profile data is edited from multiple interfaces (admin, portal, onboarding flow)?

If this is fuzzy, we will ship identity drift and permission bugs.

### 2) Orders in collections can become a transactional trap

Orders and payments are transactional state machines, not marketing content.

Red flags if Orders live purely as collection docs:

- Weak idempotency boundaries for webhook retries
- Blurry ownership of payment-state transitions
- Hook-driven side effects with unclear ordering and failure modes
- Harder reconciliation/reporting when finance requirements grow

Orders should be modeled as domain records with explicit transitions and invariants, then projected into admin-facing views as needed.

### 3) Hook-centric workflows risk hidden coupling

Using `beforeChange`/`afterChange` as the main workflow engine creates invisible control flow and debugging hell once complexity grows.

Hooks are good for guardrails and light enrichment.  
Core business workflows (checkout, onboarding, renewals, forum permissions, governance eligibility) should live in explicit service-layer code with tests and typed contracts.

### 4) Access control can become incoherent across interfaces

We'll have:

- Payload admin users
- Member portal auth
- API routes and potentially direct DB access

Without a single authorization model, we'll accidentally create contradictory rules ("allowed in portal, blocked in admin" or vice versa).

### 5) Reporting/audit/compliance needs are not optional for CRM

CRM/ARM systems need clean audit trails:

- who changed what
- why state changed
- which workflow initiated it
- whether the transition is reversible

Collections alone don't give this for free. We need explicit event logging and domain-level history.

## Recommended architecture direction

### A) Define bounded contexts now

At minimum:

- **CMS Content**: pages, news, media, site settings, marketing blocks
- **Identity & Membership**: accounts, roles, membership lifecycle
- **Commerce**: orders, line items, payments, refunds
- **Community/Governance (future)**: forums, voting, elections

Each context needs a declared source of truth and ownership.

### B) Pick source-of-truth per entity (explicitly)

Use Payload collections when the entity is primarily content/admin-editable data.  
Use app-owned relational models when the entity is transactional, workflow-heavy, or identity-critical.

Likely split:

- **Payload-first**: Pages, News, Events (public content), Team, Site Settings, maybe Event Templates
- **App-model-first**: Member accounts/lifecycle, Orders, Payment events, Renewals, Forum/Voting entities

Payload can still surface app-model data through custom admin views or synchronization/projection layers.

### C) Add an architecture decision gate before Phase 9/11

Before implementing Members/Orders and Stripe:

1. Decide canonical identity model and key strategy
2. Define order/payment state machine and idempotency rules
3. Define service-layer boundaries (what never lives in hooks)
4. Define authz model shared across admin + portal + API
5. Define projection strategy into Payload admin UI

No gate, no implementation.

### D) Treat Payload as one interface, not the whole backend

Payload is a great cockpit for staff workflows.  
It does not need to be the storage engine for every subsystem.

## Non-negotiable implementation rules (if we proceed)

- No core business logic exclusively in hooks
- Idempotent webhook processing with explicit dedupe keys
- Explicit state transitions for membership/orders
- Audit/event log for all critical transitions
- Shared authorization policy definitions across surfaces
- Integration tests for lifecycle flows, not just happy-path CRUD

## Bottom line

If we do this right, we get a clean architecture where Payload powers content/editorial and admin UX, while Next.js service/domain layers power the actual business system.  
If we do this lazily, we get WordPress CPT syndrome with TypeScript lipstick and a very expensive rewrite later.
