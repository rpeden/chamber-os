# Chamber OS — Implementation Checklist

This is the work plan to get from the current Payload website template to a functioning Chamber OS MVP. Items are sequenced by dependency — earlier phases unblock later ones.

---

## Phase 0: Foundation & Cleanup

The existing template has scaffolding that either needs to be repurposed or removed so it doesn't confuse the real work.

- [ ] **0.1** Audit existing blocks (Content, CallToAction, MediaBlock, Archive, FormBlock) — decide which to keep, modify, or replace with Chamber OS equivalents
- [ ] **0.2** Audit existing hero system (highImpact, mediumImpact, lowImpact) — rework to support OBOT-style hero (background image + centered text + 1–3 colored CTAs)
- [ ] **0.3** Set up `src/lib/` directory structure: `lib/features.ts`, `lib/theme.ts`, `lib/stripe/` (empty for now)
- [ ] **0.4** Add `zod` for env validation — create `lib/env.ts` with typed env vars
- [ ] **0.5** Configure Tailwind theme extension for CSS custom properties (`var(--color-primary)`, etc.)
- [ ] **0.6** Remove or repurpose the `BeforeLogin` and `BeforeDashboard` placeholder components

---

## Phase 1: Site Settings & Theming

Everything downstream depends on the theme system being in place.

- [ ] **1.1** Create `site-settings` global — fields: site name, logo (upload), tagline, contact info (address, phone, email), social links (array of platform + URL)
- [ ] **1.2** Add theme group to `site-settings` — fields: primary color, secondary color, accent color, heading font (select from curated list), body font (select from curated list), section spacing
- [ ] **1.3** Build theme injection — server component that reads `site-settings` global and outputs a `<style>` tag with CSS custom properties into the `<head>`
- [ ] **1.4** Update `globals.css` / Tailwind config to reference CSS custom properties for all theme-able values (colors, fonts, spacing)
- [ ] **1.5** Create shared block wrapper component — handles section spacing, background variants (`light-bg`, `dark-bg`, `brand-bg`), max-width container
- [ ] **1.6** Register `site-settings` global in `payload.config.ts`
- [ ] **1.7** Generate types (`pnpm generate:types`) and validate with `tsc --noEmit`

---

## Phase 2: Navigation Enhancement

The current header/footer globals are flat link arrays. Chamber sites need dropdown menus and structured footers.

- [ ] **2.1** Enhance Header global — support nested nav items (top-level link + optional dropdown array of child links), optional "utility nav" row (e.g., "Be a Member", "Member Login", "Contact" + social icons)
- [ ] **2.2** Build responsive Header component — desktop: two-row nav (utility + main with dropdowns); mobile: hamburger with slide-out or accordion
- [ ] **2.3** Enhance Footer global — support footer columns (array of column title + links), copyright text, social links (pulled from `site-settings`)
- [ ] **2.4** Build Footer component — multi-column layout, responsive stacking
- [ ] **2.5** Generate types and validate

---

## Phase 3: Hero Block Rework

The current hero has 3 variants (high/medium/low impact). Rework to match the OBOT pattern while keeping it flexible.

- [ ] **3.1** Redesign hero field schema — background image (required), overlay opacity (number, default 0.4), heading (text), subheading (text), CTA buttons (array of 1–3, each with label + link + color variant: primary/secondary/accent)
- [ ] **3.2** Build hero render component — full-bleed image, dark gradient overlay, centered text, row of colored CTA buttons at bottom, responsive text sizing
- [ ] **3.3** Ensure hero works with the block wrapper's spacing system
- [ ] **3.4** Test with sample content matching the OBOT hero layout

---

## Phase 4: Core Layout Blocks

These are the building blocks staff will use on nearly every page.

### `text-columns`
- [ ] **4.1** Define Payload schema — layout preset (select), array of columns (rich text each), section heading (optional), background variant
- [ ] **4.2** Build render component — CSS Grid with responsive breakpoints, columns stack on mobile

### `card-grid`
- [ ] **4.3** Define Payload schema — columns (select: 2/3/4), cards (array of: image upload + heading + body rich text + optional link), section heading (optional), background variant
- [ ] **4.4** Build render component — CSS Grid, equal-height cards, responsive collapse (4→2→1)

### `icon-grid`
- [ ] **4.5** Define Payload schema — items (array of 2–4: icon upload + overline text + heading + body text + optional link), columns (select: 2/4), background variant
- [ ] **4.6** Build render component — grid layout with icon circle/container, overline + heading stack

### `image-text`
- [ ] **4.7** Define Payload schema — image (upload), heading, body (rich text), CTA (link + label), layout variant (`image-left` / `image-right`), background variant
- [ ] **4.8** Build render component — two-column flex/grid, image takes ~50% width, reverse order for `image-right` variant, stacks on mobile

### `cta-banner`
- [ ] **4.9** Define Payload schema — heading, body (rich text), CTA (link + label + color variant), background variant (`brand-bg` / `dark-bg` / `image-bg` with optional upload)
- [ ] **4.10** Build render component — full-width section, centered text, prominent button

### `stats-bar`
- [ ] **4.11** Define Payload schema — stats (array of: number text + label text), background variant, optional section heading
- [ ] **4.12** Build render component — horizontal row of stats with large numbers, responsive wrap

### `mixed-content-row`
- [ ] **4.13** Define Payload schema — slots (array of 1–4: width select + content type select + content fields per type)
- [ ] **4.14** Build render component — CSS Grid with column widths, responsive stacking

### Block registration
- [ ] **4.15** Register all new blocks in the Pages collection config
- [ ] **4.16** Update `RenderBlocks.tsx` with new block components
- [ ] **4.17** Generate types and validate

---

## Phase 5: Collections — Events & News

These collections feed the dynamic blocks (events-list, news-feed).

### Events
- [ ] **5.1** Create Events collection — title, slug, description (rich text), location (text), startDate, endDate, featured image, `isFeatured` (boolean), `isChambersEvent` (boolean)
- [ ] **5.2** Add ticketing fields — ticketing type select (`none`/`external-link`/`chamber-managed`), conditional fields: externalTicketUrl, ticket-types array (name, description, price in cents, capacity, saleStart, saleEnd), serviceFee group (feeType, feeAmount)
- [ ] **5.3** Add status field (draft/published/cancelled) with appropriate access control
- [ ] **5.4** Add event detail page route — `app/(frontend)/events/[slug]/page.tsx` with `generateMetadata`
- [ ] **5.5** Add events index page — `app/(frontend)/events/page.tsx` with filtering (upcoming, past, Chamber events)

### Event Templates
- [ ] **5.6** Create Event Templates collection — series name, default description (rich text), default featured image, default location, default ticketing config (ticketing type, ticket-types array, service fee), default `isChambersEvent`
- [ ] **5.7** Add `eventTemplate` relationship field to Events collection (optional) — when selected, auto-populates event fields from template defaults
- [ ] **5.8** Build "New from Template" workflow — custom admin UI button or `beforeChange` hook that copies template defaults into a new event, allowing staff to override any field per instance
- [ ] **5.9** Access control on Event Templates — authenticated create/update/delete, restrict to admin/staff roles

### News (repurpose Posts)
- [ ] **5.10** Evaluate whether to repurpose the existing Posts collection as News or create a new one — Posts already has slug, content, SEO, categories, versioning
- [ ] **5.11** Add any missing News-specific fields (featured image prominence, excerpt, etc.) or rename the collection
- [ ] **5.12** Ensure news detail page route exists with `generateMetadata`
- [ ] **5.13** Ensure news index page exists with category filtering

### Team
- [ ] **5.14** Create Team collection — name, title, bio (rich text), headshot (upload), type (staff/board), display order (number), email (optional), LinkedIn (optional)
- [ ] **5.15** Add access control (authenticated create/update/delete, public read for published)

### Generate & validate
- [ ] **5.16** Generate types and validate

---

## Phase 6: Dynamic Blocks

These blocks pull from the collections defined in Phase 5.

### `events-list`
- [ ] **6.1** Define Payload schema — display mode (select: `featured` / `upcoming` / `all`), max items (number), section heading, "View All" CTA link, background variant
- [ ] **6.2** Build render component — queries Events collection, renders cards with background image, date badge, title overlay, arrow link; responsive

### `news-feed`
- [ ] **6.3** Define Payload schema — max items (number), category filter (relationship to categories, optional), section heading, intro text, "View All" CTA link, background variant
- [ ] **6.4** Build render component — queries News/Posts collection, renders cards with featured image, category badge, title, responsive

### `testimonials`
- [ ] **6.5** Define Payload schema — testimonials (array of: pullquote text, full quote rich text, attribution name + org, optional photo), auto-advance (boolean), background variant
- [ ] **6.6** Build render component (client component for carousel) — single testimonial visible, prev/next buttons, pullquote on left + full quote on right (stacks on mobile), optional auto-advance

### `sponsors-grid`
- [ ] **6.7** Define Payload schema — tiers (array of: tier name, logos array of media upload + link URL, display mode select `grid`/`carousel`), background variant
- [ ] **6.8** Build render component — tier heading + logo row, carousel mode with prev/next (client component for carousel logic), uniform logo height

### Block registration
- [ ] **6.9** Register all new blocks in Pages collection config
- [ ] **6.10** Update `RenderBlocks.tsx`
- [ ] **6.11** Generate types and validate

---

## Phase 7: Admin UX

The default Payload admin is functional but looks like a developer tool. Chamber staff need it to feel approachable — clear labels, logical grouping, helpful descriptions, and a dashboard that surfaces what matters.

### Dashboard
- [ ] **7.1** Custom dashboard component — replace the default "welcome" block with a Chamber OS dashboard showing: recent events (next 5 upcoming), recent orders (last 10), quick-action buttons ("Create Event", "New News Post", "Add Member")
- [ ] **7.2** At-a-glance stats panel — total active members, upcoming events count, tickets sold this month (queries run server-side)

### Collection UX
- [ ] **7.3** Descriptive field labels and `description` help text on every non-obvious field across all collections — no developer jargon, plain English (e.g., "Service Fee" description: "A small fee added to each ticket to cover platform costs. Leave as 'None' if you don't want to charge extra.")
- [ ] **7.4** Sensible `admin.defaultColumns` on all list views — Events: title, date, status, ticketing; Members: business name, contact name, tier, status; Orders: event title, purchaser, status, date
- [ ] **7.5** Admin groups — organize collections in the sidebar: "Content" (Pages, News), "Events" (Events, Event Templates, Orders), "Members" (Members, Membership Tiers), "Settings" (Site Settings, Navigation, Team, Users)
- [ ] **7.6** `useAsTitle` on all collections — Events use title, Members use business name, Team uses name, etc.
- [ ] **7.7** Collapsed-by-default for complex nested fields (ticket-types array, service fee group) so the event form doesn't look overwhelming on first load

### Block Picker UX
- [ ] **7.8** Descriptive block labels with `admin.description` — staff should know what each block does without trying it (e.g., "Card Grid: A row of cards, each with an optional image, heading, and text. Great for team bios or service highlights.")
- [ ] **7.9** Logical block ordering in the picker — most-used blocks first (hero, text-columns, card-grid, image-text), specialized blocks later (map-embed, contact-form)

### Live Preview
- [ ] **7.10** Verify live preview works for all new blocks and collections — the template already has breakpoint config, but new blocks need to render correctly in preview mode

---

## Phase 8: Feature Flags

- [ ] **8.1** Create `lib/features.ts` — reads `CHAMBER_FEATURES` env var (JSON), exports typed `isFeatureEnabled(feature)` function with Zod validation
- [ ] **8.2** Define feature keys: `events`, `ticketing`, `memberCrm`, `newsAndBlog`, `sponsorsManagement`
- [ ] **8.3** Apply `admin.hidden` functions on collections gated by feature flags (Events, Event Templates, Orders, Members, etc.)
- [ ] **8.4** Guard frontend routes — return 404 when feature is disabled
- [ ] **8.5** Guard blocks — hide feature-gated blocks from the block picker (don't render them either)
- [ ] **8.6** Write tests for feature flag logic

---

## Phase 9: Remaining Collections

### Members
- [ ] **9.1** Create Members collection — contact info (name, email, phone, address), business name, website, social links, membership tier (relationship), status (active/lapsed/pending), renewal date, notes (rich text)
- [ ] **9.2** Add access control — admin/staff full access, members can read own record (future portal), public read limited fields for directory (future)
- [ ] **9.3** Feature-flag gate the collection

### Membership Tiers
- [ ] **9.4** Create Membership Tiers collection — name, annual price (number), features list (array of text), description (rich text), display order, Stripe Price ID (text, optional)
- [ ] **9.5** Build `membership-tiers` block — Payload schema (section heading, optional intro text, background variant) + render component (tier cards with pricing, feature list, CTA)

### Orders
- [ ] **9.6** Create Orders collection — event (relationship), ticket type identifier, purchaser name + email, Stripe Payment Intent ID, status (pending/confirmed/refunded), QR token (text, auto-generated), quantity
- [ ] **9.7** Add access control — admin read/update, no public create (API endpoint handles creation)
- [ ] **9.8** Feature-flag gate (gated on `ticketing`)

### Generate & validate
- [ ] **9.9** Generate types and validate

---

## Phase 10: Remaining Blocks

- [ ] **10.1** `contact-form` — likely leverage existing FormBlock from Payload's form-builder plugin, or build custom if the plugin is too heavy
- [ ] **10.2** `map-embed` — Payload schema (address, lat/lng, zoom level, optional overlay text) + render component (iframe embed or Leaflet/Mapbox)
- [ ] **10.3** Register and validate

---

## Phase 11: Stripe Integration

### Payment infrastructure
- [ ] **11.1** Create `lib/stripe/client.ts` — initialized Stripe SDK with env validation
- [ ] **11.2** Create `lib/stripe/create-payment-intent.ts` — takes event ID, ticket type, quantity; calculates total including service fee; creates Payment Intent; returns client secret
- [ ] **11.3** Write tests for fee calculation logic (TDD: percentage fee, flat fee, no fee, edge cases)

### API routes
- [ ] **11.4** Create checkout API route — `app/api/checkout/route.ts` — validates request, calls createPaymentIntent, returns client secret
- [ ] **11.5** Create webhook handler — `app/api/webhooks/stripe/route.ts` — verifies signature, handles `payment_intent.succeeded`, creates Order, generates QR token

### Frontend checkout
- [ ] **11.6** Build ticket selection UI on event detail page — select ticket type, quantity, see price breakdown including service fee
- [ ] **11.7** Integrate Stripe Elements for payment form
- [ ] **11.8** Build confirmation page — order summary, QR code display

### Testing
- [ ] **11.9** Write integration tests for the checkout → webhook → order creation flow
- [ ] **11.10** Test with Stripe test mode keys

---

## Phase 12: Public Frontend Polish

- [ ] **12.1** Homepage — assemble from blocks using seed data (hero, about+stats, icon-grid, events, news, testimonials, sponsors)
- [ ] **12.2** Ensure all pages have `generateMetadata()` with proper title, description, OG tags
- [ ] **12.3** Add JSON-LD structured data for events (Event schema)
- [ ] **12.4** Verify responsive behavior at mobile, tablet, desktop breakpoints
- [ ] **12.5** Accessibility audit — proper heading hierarchy, alt text, keyboard navigation, focus management
- [ ] **12.6** Performance audit — image optimization via `next/image`, font loading strategy, bundle size check
- [ ] **12.7** 404 and error pages styled consistently with theme
- [ ] **12.8** Sitemap generation (next-sitemap is already configured — verify it works)

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
- [ ] **13.8** Feature-flag gate the built-in stats (`builtInAnalytics`) — some deployments may only want GA and not the overhead of local tracking

---

## Phase 14: Seed Data & Launch Prep

- [ ] **14.1** Create SGBCC seed script — populates site-settings (including analytics config), sample pages with blocks, sample events (including at least one from a template), sample news posts, sample team members, membership tiers, event templates
- [ ] **14.2** Add SGBCC theme values to seed data (colors, fonts matching their brand)
- [ ] **14.3** Production deployment checklist — PostgreSQL adapter swap, S3/R2 storage adapter, env vars, Stripe live keys, DNS
- [ ] **14.4** Write deployment README for spinning up a new Chamber OS client instance

---

## Running Totals

| Category | Items |
|---|---|
| Globals | 1 new (site-settings), 2 enhanced (header, footer) |
| Collections | 6 new (Events, Event Templates, Orders, Members, Membership Tiers, Team), 1 repurposed (Posts→News) |
| Blocks | ~13 new/reworked (hero rework, text-columns, card-grid, icon-grid, mixed-content-row, image-text, events-list, sponsors-grid, testimonials, cta-banner, news-feed, stats-bar, membership-tiers, contact-form, map-embed) |
| Admin UX | Custom dashboard, collection grouping, descriptive labels, block picker improvements |
| Analytics | GA/GTM/custom script injection, optional built-in page view tracking (log-based, non-blocking) |
| Infrastructure | Theme system, feature flags, Stripe integration, env validation |
