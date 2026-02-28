# Chamber OS — Implementation Checklist

This is the work plan to get from the current Payload website template to a functioning Chamber OS MVP. Items are sequenced by dependency — earlier phases unblock later ones.

> **⚠️ Phases 7+ involve business logic, CRM, and payments.** Before working on anything in Phase 7 or later, read these documents in order:
> 1. **`ARCHITECTURE.md`** — Binding architectural decisions (Contact/Member split, service layer rules, auth model, order state machine). Non-negotiable.
> 2. **`hold-the-fuck-up.md`** — The concerns that prompted the architecture decisions. Context for *why*.
> 3. **`BRIEFING.md`** — Full project vision and data model details.

---

## Phase 0: Foundation & Cleanup

The existing template has scaffolding that either needs to be repurposed or removed so it doesn't confuse the real work.

- [x] **0.1** Audit existing blocks (Content, CallToAction, MediaBlock, Archive, FormBlock) — decide which to keep, modify, or replace with Chamber OS equivalents
- [x] **0.2** Audit existing hero system (highImpact, mediumImpact, lowImpact) — rework to support OBOT-style hero (background image + centered text + 1–3 colored CTAs)
- [x] **0.3** Set up `src/lib/` directory structure: `lib/features.ts`, `lib/theme.ts`, `lib/stripe/` (empty for now)
- [x] **0.4** Add `zod` for env validation — create `lib/env.ts` with typed env vars
- [x] **0.5** Configure Tailwind theme extension for CSS custom properties (`var(--color-primary)`, etc.)
- [x] **0.6** Remove or repurpose the `BeforeLogin` and `BeforeDashboard` placeholder components

---

## Phase 1: Site Settings & Theming

Everything downstream depends on the theme system being in place.

- [x] **1.1** Create `site-settings` global — fields: site name, logo (upload), tagline, contact info (address, phone, email), social links (array of platform + URL)
- [x] **1.2** Add theme group to `site-settings` — fields: primary color, secondary color, accent color, heading font (select from curated list), body font (select from curated list), section spacing
- [x] **1.3** Build theme injection — server component that reads `site-settings` global and outputs a `<style>` tag with CSS custom properties into the `<head>`
- [x] **1.4** Update `globals.css` / Tailwind config to reference CSS custom properties for all theme-able values (colors, fonts, spacing)
- [x] **1.5** Create shared block wrapper component — handles section spacing, background variants (`light-bg`, `dark-bg`, `brand-bg`), max-width container
- [x] **1.6** Register `site-settings` global in `payload.config.ts`
- [x] **1.7** Generate types (`pnpm generate:types`) and validate with `tsc --noEmit`

---

## Phase 2: Navigation Enhancement

The current header/footer globals are flat link arrays. Chamber sites need dropdown menus and structured footers.

- [x] **2.1** Enhance Header global — support nested nav items (top-level link + optional dropdown array of child links), optional "utility nav" row (e.g., "Be a Member", "Member Login", "Contact" + social icons)
- [x] **2.2** Build responsive Header component — desktop: two-row nav (utility + main with dropdowns); mobile: hamburger with slide-out or accordion
- [x] **2.3** Enhance Footer global — support footer columns (array of column title + links), copyright text, social links (pulled from `site-settings`)
- [x] **2.4** Build Footer component — multi-column layout, responsive stacking
- [x] **2.5** Generate types and validate

---

## Phase 3: Hero Block Rework

The current hero has 3 variants (high/medium/low impact). Rework to match the OBOT pattern while keeping it flexible.

- [x] **3.1** Redesign hero field schema — background image (required), overlay opacity (number, default 0.4), heading (text), subheading (text), CTA buttons (array of 1–3, each with label + link + color variant: primary/secondary/accent)
- [x] **3.2** Build hero render component — full-bleed image, dark gradient overlay, centered text, row of colored CTA buttons at bottom, responsive text sizing
- [x] **3.3** Ensure hero works with the block wrapper's spacing system
- [x] **3.4** Test with sample content matching the OBOT hero layout

---

## Phase 4: Core Layout Blocks

These are the building blocks staff will use on nearly every page.

### `text-columns`
- [x] **4.1** Define Payload schema — layout preset (select), array of columns (rich text each), section heading (optional), background variant
- [x] **4.2** Build render component — CSS Grid with responsive breakpoints, columns stack on mobile

### `card-grid`
- [x] **4.3** Define Payload schema — columns (select: 2/3/4), cards (array of: image upload + heading + body rich text + optional link), section heading (optional), background variant
- [x] **4.4** Build render component — CSS Grid, equal-height cards, responsive collapse (4→2→1)

### `icon-grid`
- [x] **4.5** Define Payload schema — items (array of 2–4: icon upload + overline text + heading + body text + optional link), columns (select: 2/4), background variant
- [x] **4.6** Build render component — grid layout with icon circle/container, overline + heading stack

### `image-text`
- [x] **4.7** Define Payload schema — image (upload), heading, body (rich text), CTA (link + label), layout variant (`image-left` / `image-right`), background variant
- [x] **4.8** Build render component — two-column flex/grid, image takes ~50% width, reverse order for `image-right` variant, stacks on mobile

### `cta-banner`
- [x] **4.9** Define Payload schema — heading, body (rich text), CTA (link + label + color variant), background variant (`brand-bg` / `dark-bg` / `image-bg` with optional upload)
- [x] **4.10** Build render component — full-width section, centered text, prominent button

### `stats-bar`
- [x] **4.11** Define Payload schema — stats (array of: number text + label text), background variant, optional section heading
- [x] **4.12** Build render component — horizontal row of stats with large numbers, responsive wrap

### `mixed-content-row`
- [x] **4.13** Define Payload schema — slots (array of 1–4: width select + content type select + content fields per type)
- [x] **4.14** Build render component — CSS Grid with column widths, responsive stacking

### Block registration
- [x] **4.15** Register all new blocks in the Pages collection config
- [x] **4.16** Update `RenderBlocks.tsx` with new block components
- [x] **4.17** Generate types and validate

---

## Phase 5: Collections — Events & News

These collections feed the dynamic blocks (events-list, news-feed).

### Events
- [x] **5.1** Create Events collection — title, slug, description (rich text), location (text), startDate, endDate, featured image, `isFeatured` (boolean), `isChambersEvent` (boolean)
- [x] **5.2** Add ticketing fields — ticketing type select (`none`/`external-link`/`chamber-managed`), conditional fields: externalTicketUrl, ticket-types array (name, description, price in cents, capacity, saleStart, saleEnd), serviceFee group (feeType, feeAmount)
- [x] **5.3** Add status field (draft/published/cancelled) with appropriate access control
- [x] **5.4** Add event detail page route — `app/(frontend)/events/[slug]/page.tsx` with `generateMetadata`
- [x] **5.5** Add events index page — `app/(frontend)/events/page.tsx` with filtering (upcoming, past, Chamber events)

### Event Templates
- [x] **5.6** Create Event Templates collection — series name, default description (rich text), default featured image, default location, default ticketing config (ticketing type, ticket-types array, service fee), default `isChambersEvent`
- [x] **5.7** Add `eventTemplate` relationship field to Events collection (optional) — when selected, auto-populates event fields from template defaults
- [x] **5.8** Build "New from Template" workflow — custom admin UI button or `beforeChange` hook that copies template defaults into a new event, allowing staff to override any field per instance
- [x] **5.9** Access control on Event Templates — authenticated create/update/delete, restrict to admin/staff roles

### News (repurpose Posts)
- [x] **5.10** Evaluate whether to repurpose the existing Posts collection as News or create a new one — Posts already has slug, content, SEO, categories, versioning
- [x] **5.11** Add any missing News-specific fields (featured image prominence, excerpt, etc.) or rename the collection
- [x] **5.12** Ensure news detail page route exists with `generateMetadata`
- [x] **5.13** Ensure news index page exists with category filtering

### Team
- [x] **5.14** Create Team collection — name, title, bio (rich text), headshot (upload), type (staff/board), display order (number), email (optional), LinkedIn (optional)
- [x] **5.15** Add access control (authenticated create/update/delete, public read for published)

### Generate & validate
- [x] **5.16** Generate types and validate

---

## Phase 6: Dynamic Blocks

### Website-First Priority Sequence (Do This Before CRM / Member Portal)

- [x] **WF.1** Build Phase 6 dynamic blocks (`events-list`, `news-feed`, `testimonials`, `sponsors-grid`) and register them
- [x] **WF.2** Build homepage composition target from Phase 12.1 using those blocks (OBOT-style section order)
- [x] **WF.3** Replace template/demo seed with Chamber-oriented placeholder content (hero, homepage sections, events/news/testimonials/sponsors)
- [x] **WF.4** Frontend polish pass from Phase 12 (metadata, responsive QA, accessibility, performance baseline)
- [x] **WF.5** Only after WF.1–WF.4: resume admin CRM/member onboarding phases

These blocks pull from the collections defined in Phase 5.

### `events-list`
- [x] **6.1** Define Payload schema — display mode (select: `featured` / `upcoming` / `all`), max items (number), section heading, "View All" CTA link, background variant
- [x] **6.2** Build render component — queries Events collection, renders cards with background image, date badge, title overlay, arrow link; responsive

### `news-feed`
- [x] **6.3** Define Payload schema — max items (number), category filter (relationship to categories, optional), section heading, intro text, "View All" CTA link, background variant
- [x] **6.4** Build render component — queries News/Posts collection, renders cards with featured image, category badge, title, responsive

### `testimonials`
- [x] **6.5** Define Payload schema — testimonials (array of: pullquote text, full quote rich text, attribution name + org, optional photo), auto-advance (boolean), background variant
- [x] **6.6** Build render component (client component for carousel) — single testimonial visible, prev/next buttons, pullquote on left + full quote on right (stacks on mobile), optional auto-advance

### `sponsors-grid`
- [x] **6.7** Define Payload schema — tiers (array of: tier name, logos array of media upload + link URL, display mode select `grid`/`carousel`), background variant
- [x] **6.8** Build render component — tier heading + logo row, carousel mode with prev/next (client component for carousel logic), uniform logo height

### Block registration
- [x] **6.9** Register all new blocks in Pages collection config
- [x] **6.10** Update `RenderBlocks.tsx`
- [x] **6.11** Generate types and validate

---

## Architecture Gate (Before Phase 7)

**Stop.** Before writing any code for Phases 7–18, verify you have read and understood `ARCHITECTURE.md`. The following decisions are settled and not up for re-litigation:

- [x] **AG.1** Contacts and Members are separate collections (ADR-2)
- [x] **AG.2** Business logic lives in `src/lib/` service layer, not in Payload hooks (ADR-3)
- [x] **AG.3** Service layer directory structure defined (ADR-4)
- [x] **AG.4** Dual auth model — Payload auth for admin, NextAuth for member portal (ADR-5)
- [x] **AG.5** Order state machine with explicit transitions (ADR-6)
- [x] **AG.6** Audit logging for all critical transitions (ADR-7)
- [x] **AG.7** Bounded contexts declared with ownership (ADR-8)

---

## Phase 7: Admin UX & Custom Views

The default Payload admin is functional but looks like a developer tool. Chamber staff need it to feel approachable — clear labels, logical grouping, helpful descriptions, and a dashboard that surfaces what matters. Business workflows (CRM, event management) get purpose-built custom views, not generic collection editors.

### Dashboard
- [x] **7.1** Custom dashboard component — replace the default "welcome" block with a Chamber OS dashboard showing: recent events (next 5 upcoming), recent posts (last 5), quick-action buttons ("Create Event", "New News Post", "New Page"), at-a-glance stat cards
- [x] **7.2** At-a-glance stats panel — upcoming events count, published posts count, published pages count (queries run server-side). Members/orders stats are placeholder until Phase 9.

### Custom Admin Views
- [ ] **7.3** Register custom views in `payload.config.ts` under `admin.components.views` — these render inside the admin shell (same sidebar, same auth) but with purpose-built UIs
- [ ] **7.4** **Events Manager view** (`/admin/events-manager`) — calendar/list hybrid showing upcoming events, ticket sales status, quick actions (duplicate event, create from template). Not a replacement for the Events collection CRUD, but a workflow-oriented overview.
- [ ] **7.5** **CRM Dashboard view** (`/admin/crm`) — member overview with search/filter, membership status breakdown, renewal alerts, recent activity. Queries the Members collection via Local API. _(blocked until Phase 9)_
- [ ] **7.6** **Orders view** (`/admin/orders-dashboard`) — filterable order list with status, revenue summary, export capability. Purpose-built for staff who need to check ticket sales, not navigate a generic collection list. _(blocked until Phase 9)_
- [ ] **7.7** Custom sidebar nav group component (`afterNavLinks`) — adds "Chamber Management" section to the sidebar with links to the custom views above

### Collection UX
- [x] **7.8** Descriptive field labels and `description` help text on every non-obvious field across all collections — no developer jargon, plain English (e.g., "Service Fee" description: "A small fee added to each ticket to cover platform costs. Leave as 'None' if you don't want to charge extra.")
- [x] **7.9** Sensible `admin.defaultColumns` on all list views — Events: title, date, status, ticketing; Posts/Pages: title, slug, updatedAt. Members/Orders columns will be set when those collections ship (Phase 9).
- [x] **7.10** Admin groups — organize collections in the sidebar: "Content" (Pages, Posts, Media, Categories), "Events" (Events, Event Templates), "Settings" (Site Settings, Header, Footer, Team, Users). "Members & Contacts" and "Purchases" groups will be added in Phase 9.
- [x] **7.11** `useAsTitle` on all collections — Events use title, Team uses name, EventTemplates use seriesName, etc. (all were already set; verified)
- [x] **7.12** Collapsed-by-default for complex nested fields — ticket-types array and service fee group both collapse on load. (`initCollapsed` on arrays; description-only on groups since groups don't support `initCollapsed`)

### Block Picker UX
- [x] **7.13** Descriptive block labels on all blocks — proper singular/plural labels added to Archive, Banner, CallToAction, Content, MediaBlock. CardGrid, CtaBanner, EventsList, IconGrid, ImageText, MixedContentRow, NewsFeed, SponsorsGrid, StatsBar, Testimonials, TextColumns already had labels.
- [x] **7.14** Logical block ordering in the picker — most-used first (Content, Image+Text, Card Grid, Text Columns, CTA, CTA Banner), then specialized content (Events List, News Feed, Testimonials, Sponsors Grid, Stats Bar, Icon Grid, Mixed Content Row), then utility (Media, Archive, Form).

### Live Preview
- [ ] **7.15** Verify live preview works for all new blocks and collections — the template already has breakpoint config, but new blocks need to render correctly in preview mode

---

## Phase 9: Contacts, Members & Orders

> **Read `ARCHITECTURE.md` (ADR-2 through ADR-7) before implementing this phase.** Contacts and Members are separate entities. Business logic lives in the service layer. Orders follow an explicit state machine.

Payload collections provide storage, admin UI, and typed API. Business logic (lifecycle transitions, billing, onboarding) lives in `src/lib/` services that are independently testable. Hooks are thin wrappers that call services.

### Contacts
- [x] **9.0a** Create Contacts collection — name, email, phone, address, type (`person` | `organization`), organization relationship (self-ref for linking people to their org), tags (array), notes (rich text), social links, website
- [x] **9.0b** Add access control — admin/staff full CRUD, public read limited fields for directory (future)
- [x] **9.0c** Add `admin.group: 'Members & Contacts'` for sidebar organization

### Members
- [x] **9.1** Create Members collection — contact relationship (required → Contacts, the entity that IS the member — org or person), primary contact relationship (optional → Contacts, the go-to human when member is an org), membership tier (relationship → Membership Tiers), status (`pending` | `active` | `lapsed` | `cancelled` | `reinstated`), renewal date, joined date, stripe customer ID (optional), xero contact ID (optional, for accounting sync), internal notes (rich text). Admin labels: singular "Member", plural "Members".
- [x] **9.2** Add access control — admin/staff full access, members can read own record via portal (with `overrideAccess: false`), no public access
- [x] **9.3** Add `admin.group: 'Members & Contacts'` for sidebar organization
- [x] **9.10** Staff-assisted onboarding workflow (MVP path) — admin/CRM flow with two paths: "New Organization Member" (create/select org Contact, select/create primary contact person) and "New Individual Member" shortcut (creates person Contact + Member in one step). Implemented via dashboard onboarding panel + `/api/staff/onboarding` endpoint backed by `OnboardingService`.
- [x] **9.11** Create `src/lib/members/membership-service.ts` — lifecycle transitions (activate, lapse, reinstate, cancel) with audit logging via `AuditService`. No lifecycle logic in hooks.
- [x] **9.12** Create `src/lib/members/onboarding-service.ts` — centralized onboarding logic used by both staff-assisted and future self-serve flows. Creates Contact + Member records atomically.
- [x] **9.13** Create `src/lib/audit/audit-service.ts` — append-only logging for critical transitions (member status changes, order status changes, payment events). See ADR-7.

### Membership Tiers
- [x] **9.4** Create Membership Tiers collection — name, annual price (number), features list (array of text), description (rich text), display order, Stripe Price ID (text, optional)
- [x] **9.5** Build `membership-tiers` block — Payload schema (section heading, optional intro text, background variant) + render component (tier cards with pricing, feature list, CTA). Highlighted tier support, currency-aware pricing display, responsive grid.

### Orders
- [x] **9.6** Create Orders collection — event (relationship), ticket type identifier, purchaser name + email, **optional** contact relationship (nullable → Contacts), Stripe Payment Intent ID, status (`pending` | `confirmed` | `refunded`), QR token (text, auto-generated), quantity, service fee amount (tracked separately for reporting)
- [x] **9.7** Add access control — admin read/update, no public create (API endpoint handles creation via `OrderService`). **Status field is not directly editable in admin** — transitions go through `OrderService` (ADR-6).
- [x] **9.14** Create `src/lib/orders/order-service.ts` — explicit state machine for order transitions (pending → confirmed → refunded) with idempotent webhook handling and audit logging. See ADR-6.
- [x] **9.15** Create `src/lib/orders/fee-calculator.ts` — pure function for service fee calculation (percentage, flat, none). TDD this first.

### Generate & validate
- [x] **9.9** Generate types and validate

---

## Phase 10: Remaining Blocks

- [x] **10.1** `contact-form` — leveraged existing `FormBlock` from Payload's form-builder plugin (already registered in Pages layout)
- [x] **10.2** `map-embed` — Payload schema (address, lat/lng, zoom level, optional overlay text) + render component (iframe embed)
- [x] **10.3** Register and validate

---

## Phase 11: Stripe Integration

> **All payment logic lives in `src/lib/stripe/` and `src/lib/orders/`.** No Stripe API calls in hooks or API route handlers directly. API routes validate input and delegate to service functions. See ADR-3.

### Payment infrastructure
- [x] **11.1** Create `lib/stripe/client.ts` — initialized Stripe SDK with env validation
- [x] **11.2** Create `lib/stripe/create-payment-intent.ts` — takes event ID, ticket type, quantity; calculates total including service fee; creates Payment Intent; returns client secret
- [x] **11.3** Write tests for fee calculation logic (TDD: percentage fee, flat fee, no fee, edge cases)

### API routes
- [x] **11.4** Create checkout API route — `app/api/checkout/route.ts` — validates request, calls createPaymentIntent, returns client secret + paymentIntentId; **must support guest checkout (no member auth required)**
- [x] **11.5** Create webhook handler — `app/api/webhooks/stripe/route.ts` — verifies signature, delegates to `OrderService.confirmFromWebhook()` which handles idempotent order confirmation, QR token generation, audit logging, and confirmation email. Webhook handler is thin.

### Frontend checkout
- [x] **11.6** Build ticket selection UI on event detail page — select ticket type, quantity, see price breakdown including service fee
- [x] **11.7** Integrate Stripe Elements for payment form
- [x] **11.8** Build confirmation page — order summary, QR code display (works for both guests and logged-in members)
- [x] **11.11** Free registration flow — `createFreeRegistration` service + 8 tests; `/api/register` route; `TicketCheckout` branches free vs paid (skips Stripe for price=0); confirmation page handles `?token=<qrToken>` for instant QR display
- [x] **11.12** Two-column event page layout — description left, ticket/registration widget right (sticky); synthesizes `General Registration` ticket for `free-registration` events; widget visible for both event types
- [x] **11.13** Sales tax support — `taxName` + `taxRate` (%) in Site Settings → Billing tab; tax calculated on (base + service fee) and stored as `taxAmount` on order; shown as line item in ticket widget preview and on confirmation page; `CurrencyField` admin input bug fixed (was `type="number"` with immediate commit — now `type="text"` with blur-commit so multi-digit values like $10/$20 work correctly)
- [ ] **11.14** *(Future)* Per-ticket-type tax-inclusive toggle — allow marking a ticket price as already including tax (display embedded tax amount as a note rather than adding it on top). Currently all prices are tax-exclusive and HST is added on top.

### Testing
- [x] **11.9** Write integration tests for the checkout → webhook → order creation flow
- [ ] **11.10** Test with Stripe test mode keys

---

## Phase 12: Public Frontend Polish

- [x] **12.1** Homepage — assemble from blocks using seed data (hero, about+stats, icon-grid, events, news, testimonials, sponsors)
- [x] **12.2** Ensure all pages have `generateMetadata()` with proper title, description, OG tags
- [x] **12.3** Add JSON-LD structured data for events (Event schema)
- [ ] **12.4** Verify responsive behavior at mobile, tablet, desktop breakpoints
- [x] **12.5** Accessibility audit — proper heading hierarchy, alt text, keyboard navigation, focus management
- [ ] **12.6** Performance audit — image optimization via `next/image`, font loading strategy, bundle size check
- [x] **12.7** 404 and error pages styled consistently with theme
- [x] **12.8** Sitemap generation (next-sitemap is already configured — verify it works)

---

## Phase 13: Analytics & Site Stats

Two tracks: easy third-party integration (Google Analytics et al.) and lightweight built-in stats that don't depend on a third party.

### Third-Party Analytics Integration
- [ ] **13.1** Add analytics fields to `site-settings` global — Google Analytics measurement ID (text), optional Google Tag Manager container ID, optional custom `<head>` script injection field (for Plausible, Fathom, Matomo, etc.)
- [ ] **13.2** Inject analytics scripts in `<head>` via the frontend layout — conditionally rendered only when IDs are present, using `next/script` with appropriate loading strategy (`afterInteractive` for GA, etc.)
- [ ] **13.3** Support consent-aware loading — a simple cookie-consent banner (or at minimum, a flag in site-settings to disable analytics until consent is implemented). Canadian privacy law (PIPEDA) matters here.

### Built-In Stats (Lightweight)
- [ ] **13.4** Create `page-views` collection — path (text, indexed), date (date, indexed), count (number). Stores daily aggregates, not individual hits.
- [ ] **13.5** Build background ingestion — a cron job or Payload job that parses server/access logs (nginx, Caddy, or Next.js middleware-logged entries) and upserts daily page view counts. Runs off the request path, no real-time tracking overhead.
- [ ] **13.6** Alternative lightweight approach: Next.js middleware that increments a counter via a non-blocking fire-and-forget API call (or queues to a simple buffer that flushes periodically). Must not add latency to page loads — if it can't be truly non-blocking, use the log-parsing approach instead.
- [ ] **13.7** Admin stats dashboard panel — extend the custom dashboard (Phase 7.1) with a "Site Stats" tab or section: page views over last 7/30/90 days, top pages, basic trend line. Server-rendered, queries the `page-views` collection.

---

## Phase 14: Seed Data & Launch Prep

- [x] **14.1** Create SGBCC seed script — populates site-settings (including analytics config), sample pages with blocks, sample events (including at least one from a template), sample news posts, sample team members, membership tiers, event templates
- [x] **14.2** Add SGBCC theme values to seed data (colors, fonts matching their brand)
- [ ] **14.3** Production deployment checklist — PostgreSQL adapter swap, S3/R2 storage adapter, env vars, Stripe live keys, DNS
- [ ] **14.4** Write deployment README for spinning up a new Chamber OS client instance

---

## Phase 15: Feature Flags (Deferred — Multi-Tenant Prep)

> Not needed for V0 beta (single chamber, all features enabled). Implement when preparing for multi-tenant deployment or white-label distribution.

- [ ] **15.1** Create `lib/features.ts` — reads `CHAMBER_FEATURES` env var (JSON), exports typed `isFeatureEnabled(feature)` function with Zod validation
- [ ] **15.2** Define feature keys: `events`, `ticketing`, `memberCrm`, `newsAndBlog`, `sponsorsManagement`, `memberPortal`, `builtInAnalytics`
- [ ] **15.3** Apply `admin.hidden` functions on collections gated by feature flags
- [ ] **15.4** Guard frontend routes — return 404 when feature is disabled
- [ ] **15.5** Guard blocks — hide feature-gated blocks from the block picker
- [ ] **15.6** Write tests for feature flag logic

---

## Phase 16: Member Portal (Post-MVP)

> **Read `ARCHITECTURE.md` ADR-5 before implementing.** The member portal authenticates against the **Contacts** collection via NextAuth, not Payload auth. Membership status determines authorization, not authentication. A Contact with no active membership can still log in.

The member portal is a **Next.js sub-app** under `/members/*` — standard React pages with their own auth, not Payload admin views. It shares the same database (reads Contacts + Members collections) but has a completely separate UX designed for members, not staff.

### Auth
- [ ] **15.1** Install and configure NextAuth/AuthJS with credentials provider (email + password) — authenticates against Contacts collection
- [ ] **15.2** Member self-onboarding flow (post staff-first rollout) — friendly registration/join path with email verification, Contact creation, and onboarding via `OnboardingService`
- [ ] **15.3** Password reset flow
- [ ] **15.4** Session management — JWT or database sessions, configurable timeout. Session carries Contact ID; membership status is looked up per-request from Members collection.

### Portal Pages
- [ ] **15.5** Member dashboard (`/members/dashboard`) — overview of membership status, upcoming events, recent activity
- [ ] **15.6** Profile editor (`/members/profile`) — edit business info, contact details, social links, logo. Writes to the Members Payload collection via API route.
- [ ] **15.7** Membership status page — current tier, renewal date, payment history, upgrade/downgrade options
- [ ] **15.8** Order history — past ticket purchases, downloadable receipts
- [ ] **15.9** Event RSVP — browse upcoming events, register/purchase tickets from within the portal

### Public Directory
- [ ] **15.10** Member directory page (`/members/directory`) — searchable, filterable list of active members with public profile info. No auth required for browsing; member controls which fields are public.
- [ ] **15.11** Individual member profile page (`/members/directory/[slug]`) — public-facing business profile

---

## Phase 17: Visual Page Editor Investigation

- [ ] **16.1** Evaluate [Puck](https://github.com/measuredco/puck) — MIT-licensed embeddable React visual page editor. Install in a throwaway branch, define 2–3 block types, assess UX quality and integration complexity with our Payload backend.
- [ ] **16.2** Prototype Puck integration — build a proof-of-concept custom admin view that embeds Puck for page editing, mapping Puck's JSON output to our existing Payload block schema. Assess whether the improved editing UX justifies the added React dependency.
- [ ] **16.3** Decision gate — adopt Puck as the page editor, stick with Payload's built-in block editing, or identify a hybrid approach. Document the decision and rationale.

---

## Phase 18: Forums & Governance (Future)

These build on the member portal and are part of the long-term "democracy in a box" vision. Not in MVP scope but documented to ensure architecture decisions don't block them.

### Forums
- [ ] **17.1** Discussion board data model — topics, threads, posts (likely Payload collections or direct DB tables depending on scale)
- [ ] **17.2** Forum UI — member-only, moderation tools for staff
- [ ] **17.3** "Official meeting" designation on threads — defined open/close dates, participation tracking for quorum
- [ ] **17.4** Email notifications for subscribed threads

### Voting & Elections
- [ ] **17.5** Motion/resolution creation — staff creates motion, defines voting window
- [ ] **17.6** Ballot casting UI — one-member-one-vote enforcement, secret ballot option
- [ ] **17.7** Board elections — nomination period, candidate profiles, ranked-choice or plurality voting
- [ ] **17.8** Results tabulation and publication
- [ ] **17.9** Audit trail — who voted and when (but not how, for secret ballots)

---

## Phase 19: External Accounting Integrations (Later Nice-to-Have)

- [ ] **18.1** Design integration boundary — define outbound sync events for member create/update and optional order/invoice updates
- [ ] **18.2** Implement Xero connector (optional, feature-flagged) — OAuth setup, contact/customer mapping, retry-safe background sync jobs
- [ ] **18.3** Add sync status visibility in admin — last sync time, error state, manual re-sync action
- [ ] **18.4** Failure isolation rule — Xero outages/errors must never block member onboarding, checkout, or core CRM operations

---

## Running Totals

| Category | Items |
|---|---|
| Globals | 1 new (site-settings), 2 enhanced (header, footer) |
| Collections | 6 new (Events, Event Templates, Orders, Members, Membership Tiers, Team), 1 repurposed (Posts→News) |
| Blocks | ~13 new/reworked (hero rework, text-columns, card-grid, icon-grid, mixed-content-row, image-text, events-list, sponsors-grid, testimonials, cta-banner, news-feed, stats-bar, membership-tiers, contact-form, map-embed) |
| Custom Admin Views | 4 (Chamber OS dashboard, Events Manager, CRM Dashboard, Orders Dashboard) |
| Admin UX | Collection grouping, descriptive labels, block picker improvements, custom sidebar nav |
| Member Portal | Next.js sub-app with own auth (NextAuth/AuthJS), ~8 pages (dashboard, profile, directory, etc.) |
| Analytics | GA/GTM/custom script injection, optional built-in page view tracking (log-based, non-blocking) |
| Infrastructure | Theme system, feature flags, Stripe integration, env validation |
| Future (Post-MVP) | Forums, voting/elections, governance tools |

### Architecture Boundaries

| What | Where | Why |
|---|---|---|
| Pages, Posts, Media, Site Settings | Payload collections + globals | Content management — Payload's CRUD is perfect for this |
| Events, Members, Orders, Team | Payload collections | Structured data storage + access control |
| CRM dashboard, event management | Custom admin views (inside Payload admin shell) | Purpose-built workflow UIs, not generic CRUD |
| Member portal, checkout, directory | Next.js pages (`/members/*`, `/checkout/*`) | Application logic, separate auth, member-facing |
| Stripe, email, business logic | Next.js API routes + `lib/` services | Pure application code, no CMS involvement |
