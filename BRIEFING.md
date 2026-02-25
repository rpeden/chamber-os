# Project Briefing: Chamber OS

## What We're Building

**Chamber OS** is a white-label association management platform built on [Payload CMS](https://payloadcms.com/) with a [Next.js](https://nextjs.org/) front end. The goal is a single codebase that can be deployed for any Chamber of Commerce or similar membership association, skinned and configured per client.

**Development strategy:** We are building and dogfooding simultaneously. The live development instance is populated with real data for the **Southern Georgian Bay Chamber of Commerce (SGBCC)** based in the Georgian Bay region of Ontario, Canada. When it ships, SGBCC becomes our first client. Everything we build should work generically but be tested against SGBCC's real-world needs.

---

## Architecture Overview

### Stack

| Layer | Technology |
|---|---|
| CMS / Admin | Payload CMS |
| Front End | Next.js (App Router) |
| Database | PostgreSQL (or SQLite for local dev) |
| Payments | Stripe (Payment Intents + Webhooks + optionally Billing for recurring) |
| File Storage | Local for dev → Cloudflare R2 or S3 for production |
| Auth | Payload's built-in auth for admin; NextAuth/AuthJS for member portal |
| Styling | Tailwind CSS with CSS custom properties for theming |

### Core Principle: Payload for Content, Next.js for Everything Else

Chamber OS is **not** a CMS with business features bolted on. It's a business platform that *includes* content management. The architecture reflects this split:

**Payload CMS handles content:**
- Pages, Posts/News, Media, Categories — classic CMS content
- Site Settings, Header, Footer — site configuration globals
- Events (public-facing listings) — structured content that benefits from Payload's CRUD, versioning, and admin UI
- Members, Membership Tiers, Team — structured data that lives in Payload collections for easy admin management

**Next.js handles application logic:**
- Member portal (`/members/*`) — a semi-separate sub-app with its own auth (NextAuth/AuthJS), purpose-built dashboard pages, profile editing, payment history. Standard React pages, not Payload views.
- Event registration & checkout — API routes + Stripe, purpose-built UI
- Board governance, voting, forums (future) — pure application code
- Public member directory, event calendar with RSVP — standard Next.js pages querying the database

**Unified admin via custom Payload views:**
- Payload's admin panel supports custom views: purpose-built React pages that live inside the admin shell (same sidebar, same auth, same layout) but render whatever UI we want. These are registered in `payload.config.ts` under `admin.components.views`.
- CRM dashboard, events management, order management, communications — these are custom admin views with workflow-oriented UIs, not generic collection list/edit screens.
- Custom nav groups organize the sidebar: "Content" (Pages, Posts, Media), "Chamber Management" (custom views for CRM, events, orders), "Settings" (Site Settings, Header, Footer).
- Result: one login, one sidebar, one app. Staff never leaves the admin interface whether they're editing a page or managing a membership renewal.

**Shared database, different interfaces:**
- Payload collections (Members, Events, Orders, etc.) store the data in PostgreSQL.
- Custom admin views query the same collections via Payload's Local API.
- The member portal (public-facing) queries the same data via API routes or direct database access.
- No data duplication, no sync problems. One source of truth, multiple purpose-built interfaces.

### Directory Structure (Target)

```
src/
  app/
    (payload)/           ← Payload admin (content management + custom views)
    (frontend)/          ← Public site
      page.tsx                ← Payload-managed (blocks, hero, etc.)
      events/                 ← Payload collection for public display
      posts/                  ← Payload collection for blog/news
      members/                ← Pure Next.js — member portal (own auth)
        login/
        dashboard/
        profile/
        directory/
      board/                  ← Pure Next.js — governance, voting (future)
      api/                    ← Next.js API routes for business logic
        stripe/
        members/
        voting/
  collections/           ← Payload content & data collections
  components/
    admin/               ← Custom admin views (CRM dashboard, etc.)
  lib/
    db/                  ← Direct DB access for non-CMS operations
    stripe/
    email/
    members/             ← Member service layer — plain TypeScript
```

### Principle: Separate Editing from Output

The editor and the rendered output are completely decoupled. Payload stores structured JSON (block data + theme config). Next.js renders that data into clean, semantic HTML at request time or build time. **No editor scaffolding is ever shipped to the visitor's browser.**

---

## Theming System

Theming operates at two levels:

### 1. Site-Level Theme (CSS Custom Properties)

A `theme` object stored in Payload's global settings collection drives CSS custom properties injected into every page:

```css
:root {
  --color-primary: #2c5f8a;
  --color-accent:  #e8a020;
  --font-heading:  'Raleway', sans-serif;
  --font-body:     'Inter', sans-serif;
  --spacing-section: 4rem;
}
```

Staff edits these values in a settings panel. Changing them reskins the entire site without touching individual pages.

### 2. Block-Level Variants

Individual blocks expose a constrained set of style variants (e.g., `light-bg`, `dark-bg`, `image-left`, `image-right`). Staff picks a variant; they never touch CSS directly. Each variant maps to a pre-written template. This keeps HTML clean and output consistent.

### 3. Theme Presets (Future)

Long-term, Chamber OS ships with 5–10 curated theme presets that staff can choose from as a starting point: e.g., "Professional" (navy/gold, serif headings), "Modern" (clean sans-serif, muted tones), "Bold" (high contrast, saturated accent), "Civic" (greens/blues, government-adjacent feel), etc. A preset populates the CSS custom property values; staff can then tweak individual values if they want. This gives every deployment a distinct identity without requiring design skills.

Not in scope for MVP — for now, the site-level theme is configured manually. But the custom property architecture supports this naturally, so no refactoring will be needed when presets are added.

---

## Content Architecture: Blocks

Pages are composed of blocks. Each block has:
- A **Payload schema** (defines editable fields in the admin UI)
- A **Next.js render component** (outputs clean semantic HTML)

### Initial Block Library (MVP)

| Block | Description |
|---|---|
| `hero` | Full-width banner with heading, subtext, 0–3 CTA buttons, optional background image (see below) |
| `text-columns` | 1–4 columns of rich text with configurable widths (see below) |
| `card-grid` | Grid of cards — each card is a vertical stack of optional image, heading, and body text (see below) |
| `icon-grid` | Grid of icon + overline + heading + body items (see below) |
| `mixed-content-row` | Arbitrary column slots, each with a width fraction and content type (see below) |
| `image-text` | Image beside a block of text with `image-left` / `image-right` variant |
| `events-list` | Pulls from the Events collection; supports featured/upcoming/filtered views |
| `sponsors-grid` | Tiered logo grid with optional carousel and heading per tier (see below) |
| `testimonials` | Rotating quotes with attribution — pullquote + full text (see below) |
| `cta-banner` | Full-width call to action with heading, body, button |
| `news-feed` | Pulls from a News/Blog collection; category badges, card layout (see below) |
| `stats-bar` | Row of statistics/numbers with labels (member count, years operating, etc.) |
| `contact-form` | Simple contact form with configurable recipient |
| `membership-tiers` | Displays membership levels with pricing and features |
| `map-embed` | Embedded map with optional address overlay |

More blocks are added as needed. Keep the library tight rather than shipping half-finished blocks.

### Block Detail: `text-columns`

Staff picks a column layout from a constrained set of presets:
- 1 column (full width)
- 2 columns: 1/2 + 1/2, 2/3 + 1/3, 1/3 + 2/3
- 3 columns: 1/3 + 1/3 + 1/3, 1/2 + 1/4 + 1/4, 1/4 + 1/2 + 1/4, 1/4 + 1/4 + 1/2
- 4 columns: 1/4 + 1/4 + 1/4 + 1/4

Each column slot contains rich text. On tablet and below, columns stack vertically in source order. Staff never enters widths manually — they pick a layout preset from a visual selector.

### Block Detail: `card-grid`

A grid of visually uniform cards. Each card is a vertical stack:
1. **Image** (optional) — displayed at the top of the card
2. **Heading** (optional)
3. **Body text** (optional, rich text)
4. **Link / CTA** (optional)

Staff picks the number of columns (2, 3, or 4). All cards in a row share equal width. On smaller screens, columns collapse gracefully: 4 → 2 → 1, 3 → 1, 2 → 1.

Use cases: team bios, service offerings, feature highlights, program descriptions. The card pattern is one of the most common building blocks on any association site — having a dedicated block for it means staff don't have to wrangle `mixed-content-row` for the simple case.

### Block Detail: `mixed-content-row`

The power tool. A row of 1–4 column slots. Each slot has:
- **Width**: a fraction from a constrained set (1/4, 1/3, 1/2, 2/3, 3/4, full). Fractions in a row should sum to 1.
- **Content type** (select): `text` / `image` / `cta` / `card` (image + heading + text stack)

This is for layouts that don't fit the simpler blocks — e.g., alternating text and image columns at 1/4 width each across a row, or a 2/3-width text block beside a 1/3 CTA.

On smaller screens, slots stack in source order. Staff is warned (not blocked) if their fractions don't sum to 1.

Design principle: `card-grid` and `text-columns` should cover 80% of use cases with zero friction. `mixed-content-row` exists for the remaining 20% where staff needs explicit control over column widths and content types. Don't push staff toward the complex block when a simpler one will do.

### Block Detail: `hero`

The hero supports 0–3 CTA buttons (not just one). In the OBOT reference design, the hero has three colored buttons in a row at the bottom ("Join Us", "Member Benefits", "Upcoming Events"). Each CTA can have its own background color — staff picks from the theme palette (primary, accent, secondary) rather than entering hex codes. The hero also supports a background image with a dark overlay for text legibility.

### Block Detail: `icon-grid`

A 2- or 4-item grid where each item has:
1. **Icon** — uploaded image or selected from a curated icon set (SVG uploads via Media collection)
2. **Overline** — small uppercase label (e.g., "ADVOCACY", "NETWORKING")
3. **Heading** — bold descriptive text
4. **Body** (optional) — short paragraph
5. **Link** (optional)

Displays as a 2×2 grid on desktop (or 1×4 row for 4 items, or 1×2 for 2 items). Stacks on mobile. A clean way to present value propositions, service categories, or benefit pillars without needing images.

### Block Detail: `testimonials`

A carousel of member/partner quotes. Each testimonial has:
1. **Pullquote** — a short, highlighted excerpt (displayed large/italic)
2. **Full quote** — the complete testimonial text
3. **Attribution** — name, title, organization
4. **Photo** (optional) — headshot of the person

Renders as a single visible testimonial with previous/next navigation. Auto-advances optionally. Background variant: `light-bg` / `dark-bg` / `brand-bg`.

### Block Detail: `sponsors-grid`

Logo grid with tier support. Each tier has:
1. **Tier name** — heading displayed above the row (e.g., "Pillar Partners", "Gold Sponsors")
2. **Logos** — array of media uploads (linked to sponsor URL)
3. **Display mode** — `grid` (all visible) or `carousel` (paginated with prev/next arrows)

Logos are displayed at uniform height with preserved aspect ratio. When there are more logos than fit in the viewport, carousel mode kicks in.

### Block Detail: `news-feed`

Pulls from the News/Blog collection. Displays as a card grid (typically 3 columns). Each card shows:
1. **Featured image** as card background
2. **Category badge** — colored label overlaid on the image (e.g., "Blog", "Statement")
3. **Title**
4. **Arrow link** to the full article

Staff configures: number of posts to show, filter by category (optional), "View All" CTA link at the bottom. Cards collapse to single-column on mobile.

---

## Collections (Data Model)

### `pages`
- Title, slug, SEO metadata
- `layout` field: array of blocks (Payload's block field type)

### `events`
- Title, description, location, start/end datetime
- Featured image
- `isChambersEvent` (boolean) — flags events hosted by the Chamber itself; these can be filtered into a dedicated "Chamber Events" view while still appearing in the general calendar
- `ticketing` (select): `none` / `external-link` / `chamber-managed`
  - `none` — informational listing only; no purchase flow
  - `external-link` — links out to a third-party ticketing page (e.g. a member's own Eventbrite)
  - `chamber-managed` — Chamber sells tickets through Chamber OS; enables `ticket-types` and `serviceFee` fields
- `serviceFee` (only relevant when `ticketing = chamber-managed`):
  - `feeType`: `none` / `percentage` / `flat`
  - `feeAmount`: number (percentage as decimal e.g. `0.05` for 5%, or cents for flat fee)
  - Fee is added to the ticket price at checkout and tracked separately in the order record so reporting is clean
- `externalTicketUrl` (only relevant when `ticketing = external-link`)
- Status: draft / published / cancelled
- `ticket-types` (array of blocks, embedded on the event — not a top-level collection):
  - Each event defines its own ticket types inline
  - Fields per ticket type: name, description, price (in cents), capacity (optional), saleStart, saleEnd
  - This avoids the conceptual mess of "General Admission" being a shared global entity — GA at a Chamber gala and GA at Bob's Tractors Demo Day are different things that happen to share a name
- `eventTemplate` (optional relationship to `event-templates`) — if set, the event inherits default values from the template but each field can be overridden per instance

### Event Templates

Chambers run recurring event series — "Business After 5", "Lunch & Learn", "First Friday Networking", etc. Each occurrence is its own event (different date, maybe different venue or speaker), but they share a name pattern, default ticket types, ticketing mode, service fee config, and often a recurring description and featured image.

An `event-templates` collection provides the shared blueprint:
- **Series name** (e.g., "Business After 5")
- **Default description** (rich text)
- **Default featured image**
- **Default location**
- **Default ticketing config** (ticketing type, ticket-types array, service fee)
- **Default `isChambersEvent`** flag

When staff creates a new event from a template, all defaults are pre-populated. Staff then customizes whatever needs to change for that specific occurrence (date, venue, speaker bio in the description). The relationship is informational — the event stores its own copy of the data, not a live reference. Changing a template doesn't retroactively alter past events.

This is the difference between a frustrating admin experience ("copy-paste the last event and hope you remember to update the date") and a pleasant one ("click 'New from Business After 5 template', set the date, done"). For a Chamber ED who creates the same event 12 times a year, this is a significant quality-of-life improvement.

### Ticketing Notes

Ticket types live as an embedded block array on each event record, not as a top-level collection. This reflects reality: ticket types are scoped to a specific event and have no meaningful existence outside of it. A top-level `ticket-types` collection would create false relationships and make the admin UI confusing for staff.

The service fee feature supports the ED's vision of Chamber OS as a revenue tool — the Chamber can offer ticketing-as-a-service to members and take a small cut. Fee amounts are stored on the event, calculated at Payment Intent creation time, and tracked on the order record. Consider using Stripe Connect (destination charges) if the Chamber eventually wants to pay out member revenue directly through the platform, but that's a Phase 2 concern.

### `orders`
- Relationship to `event` and `ticket-type`
- Purchaser name + email
- Stripe Payment Intent ID
- Status: pending / confirmed / refunded
- QR code token (UUID, generated on confirmation)
- Quantity

### `members`
- Contact info (name, email, phone, address)
- Business name, website, social links
- Membership tier (relationship to `membership-tiers`)
- Membership status: active / lapsed / pending
- Renewal date
- Notes (rich text)
- Relationships to: orders, invoices

### `membership-tiers`
- Name (e.g., "Small Business", "Corporate", "Non-Profit")
- Annual price
- Features list (for display on membership-tiers block)
- Stripe Price ID (for recurring billing, if used)

### `team` (Board / Staff)
- Name, title, bio, headshot
- Type: staff / board
- Display order

### `news`
- Title, slug, body (rich text), featured image, publish date, author

### `globals`
- `site-settings`: theme values, logo, site name, contact info, social links, analytics config (Google Analytics ID, GTM container ID, optional custom head script for Plausible/Fathom/Matomo/etc.)
- `navigation`: header nav links, footer nav links, footer columns

### `page-views` (optional, feature-flagged)
- Path (text, indexed)
- Date (date, indexed)
- Count (number) — daily aggregate, not per-hit
- Populated via background job (log parsing or non-blocking middleware), never in the request path

---

## Payments: Stripe Integration

### Events / Ticketing

Flow:
1. Visitor selects ticket type and quantity on the event page
2. Front end calls an API route that creates a Stripe Payment Intent
3. Stripe.js renders the payment UI
4. On success, Stripe fires a `payment_intent.succeeded` webhook
5. Webhook handler creates the `order` record, generates QR token, sends confirmation email

No third-party ticketing plugin. No revenue cut to anyone except Stripe's standard processing fee.

### Member Dues (Optional / Phase 2)

- One-time annual payment via Payment Intent, or
- Recurring via Stripe Billing (Subscription + Price)
- Webhook handler updates member `status` and `renewalDate` on successful payment

---

## Feature Flags & Subscription Tiers

Chamber OS is sold as a tiered product. Features can be toggled per deployment via a `features` config object, so a lower-tier client doesn't get UI or functionality they haven't paid for, and enabling a new feature for a client is a config change rather than a code change.

### Feature Flag Pattern

Feature flags live in an environment variable (or a config file excluded from the repo) as a simple JSON object:

```env
CHAMBER_FEATURES='{"events":true,"ticketing":true,"memberCrm":true,"newsAndBlog":false}'
```

Payload collections, globals, and Next.js routes check the relevant flag before rendering. Disabled features simply don't appear in the admin nav or the front end — no error states, no locked padlocks, just clean absence.

### Suggested Tier Structure (starting point, adjust as needed)

| Feature | Starter | Standard | Pro |
|---|---|---|---|
| Pages / CMS | ✅ | ✅ | ✅ |
| Theming / Reskin | ✅ | ✅ | ✅ |
| Events calendar (free listings) | ✅ | ✅ | ✅ |
| Chamber-hosted event flagging | ✅ | ✅ | ✅ |
| Ticketing (Chamber-managed) | ❌ | ✅ | ✅ |
| Member service fee on tickets | ❌ | ✅ | ✅ |
| Member CRM | ❌ | ✅ | ✅ |
| Membership dues / Stripe Billing | ❌ | ❌ | ✅ |
| News / Blog | ❌ | ✅ | ✅ |
| Sponsors management | ✅ | ✅ | ✅ |

This is illustrative — the actual tier boundaries are a product decision. The point is that the code treats every significant feature as conditionally present from day one, so the tiers can be adjusted without refactoring.

### Implementation Notes

- Feature flag checks should be centralized in a single `lib/features.ts` utility, not scattered as raw env reads throughout the codebase
- Payload's `admin.hidden` option on collections/globals accepts a function — use this to hide entire collections from the admin nav when their feature flag is off
- Next.js routes that belong to a feature should return 404 when that feature is disabled

---

## Multi-Tenancy / White Label

Each deployment is a separate instance (separate database, separate Payload install, separate Next.js deploy). This is simpler than a single multi-tenant SaaS architecture and appropriate for the client scale (regional Chambers).

Tenant-specific configuration lives in environment variables and the `site-settings` global:

```env
NEXT_PUBLIC_SITE_NAME="Southern Georgian Bay Chamber of Commerce"
NEXT_PUBLIC_PRIMARY_COLOR="#2c5f8a"
STRIPE_SECRET_KEY=sk_live_...
PAYLOAD_SECRET=...
DATABASE_URI=postgres://...
```

A `deploy` script or README will guide spinning up a new client instance. Long-term this could be automated with a setup wizard, but keep it simple for now.

---

## SGBCC: Development Reference Data

The development instance is seeded with real SGBCC content. When building and testing features, use this as the reference client.

- **Organization:** Southern Georgian Bay Chamber of Commerce
- **Region:** Georgian Bay, Ontario, Canada (Midland, Penetanguishene, Collingwood area)
- **Current pain points being replaced:**
  - WordPress + Elementor (slow, bloated, hard to maintain)
  - Janky events plugin with third-party revenue cut
  - No proper member CRM — data scattered across multiple tools
- **Staff technical comfort level:** Low to moderate. UI must be simple and self-explanatory. Staff should be able to edit pages, manage events, and look up member records without developer assistance.

---

## Staff UX Principles

These inform every UI decision in the Payload admin and any custom views:

1. **Constrained choices over free-form controls.** Offer variants, not a blank canvas.
2. **Obvious defaults.** New blocks should look good with zero configuration.
3. **Minimal jargon.** Field labels should be plain English, not developer terminology.
4. **Fast.** The admin UI should feel snappy. If it doesn't, find out why.
5. **Recoverable.** Draft/publish workflow so staff can't accidentally nuke the live site.

---

## Future Roadmap

These are not in scope for MVP but are part of the long-term vision. They're documented here so architectural decisions made now don't paint us into a corner later.

### Member Portal (Phase 2)

A self-service portal where members log in and manage their own information. This is a **Next.js sub-app** under `/members/*` with its own auth system (NextAuth/AuthJS), not part of the Payload admin UI. Members never see or access Payload's admin panel.

**Architecture:**
- Auth: NextAuth/AuthJS with credentials provider (email + password), separate from Payload's admin auth
- Data: Reads/writes the same Payload Members collection via API routes or direct DB queries
- Pages: Standard Next.js Server Components + Client Components, no Payload involvement
- Shared DB: The member portal and the admin CRM view both operate on the same Members data — no sync needed

**Member-facing features:**
- View and update business profile (name, address, website, social links, logo)
- Update contact information
- View membership status, tier, and renewal date
- View order/payment history
- Download invoices and receipts
- RSVP to events, purchase tickets

This reduces staff workload significantly — instead of fielding emails and manually updating records, members maintain their own data.

### Member Forums (Phase 3)

Discussion forums accessible to authenticated members. Key insight from the ED: **most corporate governance legislation is flexible enough that a forum board open for a defined period (e.g., two weeks) can satisfy the requirement for a general meeting.** This makes forums not just a community feature but a governance tool — critical for small Chambers that struggle to get quorum at in-person AGMs.

- Topic-based discussion boards
- Moderation tools for staff
- Ability to designate a forum thread as an "official meeting" with defined open/close dates
- Thread participation logged for quorum tracking
- Email notifications for new posts in subscribed threads

### Voting & Elections (Phase 3–4)

Built on top of the member portal and forums:

**Motions & Resolutions:**
- Staff creates a motion (text of the resolution, supporting documents)
- Members cast votes during a defined voting window
- Results tallied and recorded automatically
- Supports absentee/remote voting — members vote through the portal instead of attending in person
- Audit trail: who voted, when, but secret ballot option available for sensitive votes

**Board Elections:**
- Staff defines positions up for election and nomination period
- Members can self-nominate or be nominated (with acceptance flow)
- Candidate profiles displayed in the portal
- Voting window with one-member-one-vote enforcement
- Results published automatically at close of voting
- Supports ranked-choice or simple plurality (configurable)

**The vision: democracy in a box.** A small-town Chamber with a $40K annual budget shouldn't need a $15K/year SaaS subscription to run their AGM and board elections. Chamber OS makes proper governance accessible to organizations that have been doing it with paper ballots and show-of-hands votes in church basements. This is a genuine differentiator — most association management platforms treat governance as an afterthought or don't offer it at all.

---

## Design Reference

The Ottawa Board of Trade website (ottawabot.ca) serves as the primary visual reference for the initial Chamber OS theme. Load it yourself as needed, or see the screenshots saved in `example-ui` if you need inspiration. Key patterns from that site that we need to support:

- **Hero**: Full-bleed background image, centered heading + subtext, row of 3 colored CTA buttons at the bottom
- **About + Stats**: Two-column layout — body text on left, stats panel (big numbers + labels) on right in a light gray card
- **Icon/Value Grid**: 2×2 grid of icon + overline label + heading (Advocacy, Networking, etc.)
- **Image-Text**: Photo on one side, heading + body + CTA on the other, with optional decorative shape element
- **Featured Events**: 3 cards with desaturated/B&W background images, colored date badge, title overlay, arrow link
- **Latest News**: 3 cards with colored backgrounds, category badge, title, arrow link, "View All" CTA
- **Testimonials**: Carousel with pullquote + full quote + attribution, prev/next arrows
- **Sponsor Logos**: Tier heading + logo row with carousel navigation

The aesthetic is clean, modern, lots of whitespace. Typography is bold for headings, clean sans-serif for body. Color used strategically as accents — most of the page is white/light gray with pops of brand color on buttons, badges, and decorative elements.

We are NOT cloning the OBOT site. We're building a system that can produce this *kind* of site — and many other looks — through the block + theme architecture.

---

## Current State

The project is initialized from the Payload CMS website template. What exists:

**Already in place:**
- Payload CMS with SQLite adapter for local dev
- Next.js App Router with frontend layout, header, footer
- Collections: Pages (with hero + blocks), Posts, Media, Categories, Users
- Blocks: Content, CallToAction, MediaBlock, Archive (post grid), FormBlock
- Hero system: high/medium/low impact variants with rich text + links + media
- Plugins: SEO, form builder, redirects, search, nested docs
- Draft/publish versioning on Pages
- Admin live preview with mobile/tablet/desktop breakpoints
- Tailwind CSS + Geist font
- Vitest + Playwright test infrastructure

**Not yet built:**
- `site-settings` global (theme values, logo, contact info, social links)
- Chamber-specific collections: Events, Orders, Members, Membership Tiers, Team, News
- New blocks: text-columns, card-grid, icon-grid, mixed-content-row, image-text, events-list, sponsors-grid, testimonials, cta-banner, news-feed, stats-bar, membership-tiers, map-embed
- CSS custom property theming system
- Feature flag system
- Stripe integration
- SGBCC seed data
- Navigation global (the current header/footer globals are basic link arrays — need enhancement for dropdown menus, footer columns, etc.)

**Start here:**
1. Define the `site-settings` global and wire up the CSS custom property theming system
2. Enhance the hero block to support the OBOT-style pattern (background image + multiple colored CTAs)
3. Build out core layout blocks: `text-columns`, `card-grid`, `icon-grid`, `image-text`
4. Define the Events collection and `events-list` block
5. Define the News collection and `news-feed` block
6. Build remaining blocks: `stats-bar`, `testimonials`, `sponsors-grid`, `cta-banner`
7. Enhance navigation globals for dropdown menus and footer columns
8. Implement feature flag system
9. Continue to Stripe integration and remaining collections

---

## Notes for the Agent

- **Know the boundary:** Payload for content (pages, posts, media, site config). Custom admin views for business workflows (CRM, event management, order management). Next.js pages for member-facing features (portal, checkout, directory). Don't cram application logic into Payload collections — use collections for data storage and custom views for purpose-built UIs.
- Prefer explicit, readable code over clever abstractions — this codebase will be maintained by one developer and eventually handed off
- All block render components should output semantic HTML with minimal wrapper divs
- CSS should use Tailwind utility classes for layout, CSS custom properties for theme values
- Keep Stripe logic in dedicated service files (`/lib/stripe/`), not scattered across API routes
- Every collection should have sensible access control from the start — don't leave everything public and clean it up later
- When modeling new features, ask: "Is this content (Payload collection) or application logic (Next.js)?" If a generic list/edit UI is sufficient, it's a collection. If it needs a workflow-oriented interface, build a custom admin view. If it's member-facing, it's a Next.js page.
- When in doubt, check [Payload docs](https://payloadcms.com/docs) — the API is well documented and usually does what you expect