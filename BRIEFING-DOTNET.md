# Project Briefing: Chamber OS (.NET Edition)

## What We're Building

**Chamber OS** is a white-label association management platform built on **ASP.NET Core** with a **Blazor Server** admin panel and a **Razor Pages** public-facing site. The goal is a single codebase that can be deployed for any Chamber of Commerce or similar membership association, skinned and configured per client.

**Development strategy:** We are building and dogfooding simultaneously. The live development instance is populated with real data for the **Southern Georgian Bay Chamber of Commerce (SGBCC)** based in the Georgian Bay region of Ontario, Canada. When it ships, SGBCC becomes our first client. Everything we build should work generically but be tested against SGBCC's real-world needs.

---

## Architecture Overview

### Stack

| Layer | Technology |
|---|---|
| Framework | ASP.NET Core 9 (or latest LTS) |
| Admin Panel | Blazor Server (real-time, no JS framework overhead for internal tools) |
| Public Site | Razor Pages with Tag Helpers + minimal JS (Alpine.js or htmx for interactions) |
| ORM | Entity Framework Core |
| Database | PostgreSQL (Npgsql provider) — SQLite for local dev via provider swap |
| Rich Text Editing | TipTap (JS editor in Blazor via JS interop) stored as JSON, rendered server-side to HTML |
| Payments | Stripe.net SDK (Payment Intents + Webhooks + optionally Billing for recurring) |
| File Storage | Local for dev → Cloudflare R2 or S3 via `IFileStorage` abstraction |
| Auth (Admin) | ASP.NET Core Identity with cookie auth |
| Auth (Members) | ASP.NET Core Identity (separate user type, same Identity system, different cookie/policy) |
| Styling | Tailwind CSS with CSS custom properties for theming |
| Testing | xUnit + FluentAssertions + Testcontainers (integration) + bUnit (Blazor components) + Playwright (E2E) |
| Background Jobs | .NET `IHostedService` / `BackgroundService` (upgrade to Hangfire if complexity warrants it) |

### Core Principle: One Platform, Not a CMS With Business Logic Bolted On

This is where the .NET approach has a structural advantage over the Payload + Next.js version. There's no impedance mismatch between "the CMS part" and "the application part" — it's all C#, all the same type system, all the same dependency injection container. The block-based page builder, the event management, the member CRM, the Stripe integration — they're all first-class citizens in the same application.

No framework is doing you the "favor" of generating an admin UI that's 80% right and 20% infuriating. You build exactly what you need. The trade-off is that you build *all of it* — there's no free CRUD scaffolding. But for a business platform (as opposed to a pure CMS), that's usually the right trade-off.

**The admin panel (Blazor Server) handles:**
- Page builder with block-based content editing (drag-and-drop block reordering, TipTap rich text)
- Event management with workflow-oriented UIs
- Member CRM — search, filter, bulk actions, status management
- Order management — view, refund, export
- Site configuration — theme, navigation, branding, social links
- Media library — upload, browse, select

**The public site (Razor Pages) handles:**
- CMS-managed pages (block rendering, hero, SEO metadata)
- Blog / news listing and detail pages
- Event calendar, event detail, ticket purchase
- Member portal (profile, dashboard, payment history)
- Member directory (public)
- Board governance, voting, forums (future)

### Why Blazor Server for Admin, Razor Pages for Public

**Blazor Server for admin** because:
- Real-time interactivity without shipping a JS framework. Drag-and-drop block reordering, inline editing, live search — all via SignalR, no REST API boilerplate.
- Full access to server-side services (EF Core, file storage, Stripe SDK) without an API layer. The admin panel calls services directly via DI.
- Admin users are on good connections, low latency tolerance is acceptable, and the user count is small (<10 concurrent). Blazor Server's connection-per-user model is fine here.
- Circuit management means state is trivial — no client-side state management library, no serialization headaches.

**Razor Pages for public site** because:
- SEO requires server-rendered HTML. No hydration, no JS framework, no lighthouse score anxiety.
- Public pages are cacheable. Output caching + response caching + CDN edge caching = fast.
- Minimal JS for interactions (dropdowns, mobile menu, carousels) — use Alpine.js or htmx, not a SPA framework.
- High traffic, anonymous users, zero tolerance for loading states. Razor Pages + output caching is the fastest path to painted pixels.

### Project Structure

```
ChamberOS/
├── ChamberOS.sln
├── src/
│   ├── ChamberOS.Core/                    ← Domain models, interfaces, enums
│   │   ├── Entities/
│   │   │   ├── Page.cs
│   │   │   ├── Block.cs                   ← Base block entity + block type discriminator
│   │   │   ├── Event.cs
│   │   │   ├── TicketType.cs
│   │   │   ├── Order.cs
│   │   │   ├── Member.cs
│   │   │   ├── MembershipTier.cs
│   │   │   ├── TeamMember.cs
│   │   │   ├── Post.cs
│   │   │   ├── Category.cs
│   │   │   ├── MediaFile.cs
│   │   │   ├── SiteSettings.cs
│   │   │   ├── NavigationItem.cs
│   │   │   └── SponsorTier.cs
│   │   ├── Enums/
│   │   │   ├── BlockType.cs
│   │   │   ├── TicketingMode.cs
│   │   │   ├── MemberStatus.cs
│   │   │   ├── OrderStatus.cs
│   │   │   └── PublishStatus.cs
│   │   ├── Interfaces/
│   │   │   ├── IFileStorage.cs
│   │   │   ├── IEmailService.cs
│   │   │   └── IPaymentService.cs
│   │   └── ValueObjects/
│   │       ├── Address.cs
│   │       ├── SocialLink.cs
│   │       └── ThemeConfig.cs
│   │
│   ├── ChamberOS.Infrastructure/          ← EF Core, Stripe, file storage, email
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/            ← EF Core entity configurations (Fluent API)
│   │   │   └── Migrations/
│   │   ├── Storage/
│   │   │   ├── LocalFileStorage.cs
│   │   │   └── S3FileStorage.cs
│   │   ├── Payments/
│   │   │   ├── StripePaymentService.cs
│   │   │   └── StripeWebhookHandler.cs
│   │   └── Email/
│   │       └── SmtpEmailService.cs
│   │
│   ├── ChamberOS.Application/            ← Service layer, DTOs, validation
│   │   ├── Services/
│   │   │   ├── PageService.cs
│   │   │   ├── EventService.cs
│   │   │   ├── MemberService.cs
│   │   │   ├── OrderService.cs
│   │   │   ├── MediaService.cs
│   │   │   └── SiteSettingsService.cs
│   │   ├── DTOs/
│   │   ├── Validators/                   ← FluentValidation
│   │   └── Mapping/                      ← AutoMapper or Mapperly profiles
│   │
│   ├── ChamberOS.Admin/                  ← Blazor Server app (admin panel)
│   │   ├── Program.cs
│   │   ├── Components/
│   │   │   ├── Layout/
│   │   │   │   ├── AdminLayout.razor
│   │   │   │   ├── Sidebar.razor
│   │   │   │   └── TopBar.razor
│   │   │   ├── Pages/
│   │   │   │   ├── Dashboard.razor
│   │   │   │   ├── PageEditor.razor       ← Block-based page builder
│   │   │   │   ├── EventManager.razor
│   │   │   │   ├── MemberCrm.razor
│   │   │   │   ├── OrdersDashboard.razor
│   │   │   │   ├── MediaLibrary.razor
│   │   │   │   └── SiteSettings.razor
│   │   │   ├── Blocks/                    ← Blazor editor components per block type
│   │   │   │   ├── HeroBlockEditor.razor
│   │   │   │   ├── TextColumnsEditor.razor
│   │   │   │   ├── CardGridEditor.razor
│   │   │   │   └── ...
│   │   │   └── Shared/
│   │   │       ├── RichTextEditor.razor   ← TipTap wrapper via JS interop
│   │   │       ├── MediaPicker.razor
│   │   │       ├── LinkPicker.razor
│   │   │       └── ColorPicker.razor
│   │   └── wwwroot/
│   │       └── js/
│   │           └── tiptap-interop.js      ← TipTap initialization for Blazor
│   │
│   └── ChamberOS.Web/                    ← Razor Pages app (public site)
│       ├── Program.cs
│       ├── Pages/
│       │   ├── Index.cshtml               ← Homepage (block-rendered)
│       │   ├── _Layout.cshtml
│       │   ├── _BlockPartials/            ← Partial views for each block type
│       │   │   ├── _Hero.cshtml
│       │   │   ├── _TextColumns.cshtml
│       │   │   ├── _CardGrid.cshtml
│       │   │   └── ...
│       │   ├── Events/
│       │   │   ├── Index.cshtml
│       │   │   ├── Detail.cshtml
│       │   │   └── Checkout.cshtml
│       │   ├── Posts/
│       │   │   ├── Index.cshtml
│       │   │   └── Detail.cshtml
│       │   ├── Members/                   ← Member portal (separate auth)
│       │   │   ├── Login.cshtml
│       │   │   ├── Dashboard.cshtml
│       │   │   ├── Profile.cshtml
│       │   │   └── Directory.cshtml
│       │   └── DynamicPage.cshtml         ← Catch-all for CMS-managed pages by slug
│       ├── ViewComponents/
│       │   ├── HeaderViewComponent.cs
│       │   ├── FooterViewComponent.cs
│       │   └── ThemeStylesViewComponent.cs
│       ├── TagHelpers/
│       │   ├── BlockRendererTagHelper.cs  ← <block-renderer blocks="@Model.Blocks" />
│       │   └── MediaTagHelper.cs          ← <media-image file="@img" class="..." />
│       └── wwwroot/
│           ├── css/
│           ├── js/
│           └── media/
│
└── tests/
    ├── ChamberOS.Core.Tests/
    ├── ChamberOS.Application.Tests/
    ├── ChamberOS.Infrastructure.Tests/    ← Integration tests with Testcontainers
    ├── ChamberOS.Admin.Tests/             ← bUnit component tests
    └── ChamberOS.E2E.Tests/              ← Playwright
```

### Deployment Architecture

Two options, both valid:

**Option A: Single deployable (simpler)**
- Combine Admin and Web into a single ASP.NET Core host
- Admin lives at `/admin/*`, public site at everything else
- Area-based routing or path-based middleware separation
- Single process, single port. Deploy to a single App Service / container.

**Option B: Separate hosts (better isolation)**
- Admin and Web are separate ASP.NET Core apps sharing Core/Infrastructure/Application
- Admin on an internal network / VPN, Web on the public internet
- Independent scaling — the admin panel doesn't need to handle public traffic spikes
- Shared database, separate connection strings with appropriate permissions

Start with Option A for dev simplicity. Move to Option B when there's a reason.

---

## Theming System

Theming operates at two levels:

### 1. Site-Level Theme (CSS Custom Properties)

A `SiteSettings` entity in the database stores theme configuration. The `ThemeStylesViewComponent` (or middleware) injects CSS custom properties into every page:

```css
:root {
  --color-primary: #2c5f8a;
  --color-accent:  #e8a020;
  --font-heading:  'Raleway', sans-serif;
  --font-body:     'Inter', sans-serif;
  --spacing-section: 4rem;
}
```

Staff edits these values in the Blazor admin panel. Changes are stored in the database and cached aggressively (memory cache with manual invalidation on save). The public site picks them up on next request — no restart, no redeployment.

### 2. Block-Level Variants

Individual blocks expose a constrained set of style variants (e.g., `light-bg`, `dark-bg`, `image-left`, `image-right`). Staff picks a variant in the block editor; they never touch CSS directly. Each variant maps to a pre-written partial view / CSS class set. This keeps HTML clean and output consistent.

### 3. Theme Presets (Future)

Long-term, Chamber OS ships with 5–10 curated theme presets. A preset populates the CSS custom property values; staff can then tweak individual values. The custom property architecture supports this naturally.

---

## Content Architecture: Blocks

Pages are composed of blocks. Each block has:
- A **C# entity** (defines the data stored in the database)
- A **Blazor editor component** (the admin UI for editing the block)
- A **Razor partial view** (renders clean semantic HTML on the public site)

### Block Storage Strategy

Blocks are stored as a polymorphic entity hierarchy in EF Core using TPH (Table Per Hierarchy) with a discriminator column. Each block type has its own C# class inheriting from `Block`:

```csharp
public abstract class Block
{
    public Guid Id { get; set; }
    public Guid PageId { get; set; }
    public int SortOrder { get; set; }
    public string? BlockName { get; set; }
    public string BlockType { get; set; } = default!;  // discriminator

    public Page Page { get; set; } = default!;
}

public class HeroBlock : Block
{
    public string? Heading { get; set; }
    public string? Subheading { get; set; }
    public Guid? MediaFileId { get; set; }
    public int OverlayOpacity { get; set; } = 50;
    public List<CtaButton> CtaButtons { get; set; } = [];
}

public class TextColumnsBlock : Block
{
    public string ColumnLayout { get; set; } = "1";  // "1", "1/2+1/2", "2/3+1/3", etc.
    public List<TextColumn> Columns { get; set; } = [];
}
```

**Why TPH, not JSON blobs:**
- Queryable. You can find "all pages that have a CardGrid block referencing category X" with a normal LINQ query.
- Indexable. Add indexes on block-specific columns when needed.
- Migratable. EF Core migrations handle schema changes. Adding a field to `HeroBlock` is an `ALTER TABLE ADD COLUMN`, not a prayer that your JSON migration script handles every edge case.
- Type-safe. The compiler catches mistakes that a `JsonDocument` would let slide until runtime.

**Alternative considered: JSON column per block.**
Simpler schema (one `Blocks` JSON column on `Page`), but you lose queryability and you're back to deserializing untyped blobs. Fine for a CMS. Not fine for a business platform where you need to query across block data (e.g., "find all events-list blocks filtered to category X").

If block-specific columns become unwieldy (20+ block types), consider switching to TPC (Table Per Concrete type) or a hybrid where commonly-queried blocks get their own tables and rarely-queried ones share a JSON column.

### Block Rendering (Public Site)

A `BlockRendererTagHelper` dispatches to the correct partial view based on block type:

```html
<!-- In DynamicPage.cshtml -->
@foreach (var block in Model.Blocks.OrderBy(b => b.SortOrder))
{
    <block-renderer block="@block" />
}
```

The tag helper resolves the partial view by convention: `_BlockPartials/_Hero.cshtml`, `_BlockPartials/_CardGrid.cshtml`, etc. Each partial receives a strongly-typed model.

### Block Editing (Admin Panel)

The Blazor page editor renders block-specific editor components:

```razor
@* In PageEditor.razor *@
@foreach (var block in Blocks.OrderBy(b => b.SortOrder))
{
    <BlockEditorWrapper Block="@block" OnRemove="RemoveBlock" OnMoveUp="MoveUp" OnMoveDown="MoveDown">
        @switch (block)
        {
            case HeroBlock hero:
                <HeroBlockEditor Block="@hero" />
                break;
            case TextColumnsBlock textCols:
                <TextColumnsEditor Block="@textCols" />
                break;
            // ...
        }
    </BlockEditorWrapper>
}
```

Pattern-matching on the block type. Exhaustive. The compiler tells you if you forgot a block type. Try getting that guarantee from a `switch` on a string discriminator in TypeScript.

#### Alternative: Puck as Page Editor

Worth investigating: [Puck](https://github.com/measuredco/puck) is an MIT-licensed, embeddable React visual page editor. Unlike Webstudio (which replaces your entire frontend), Puck is a component you `npm install` and drop into an existing app. It provides drag-and-drop block reordering, inline editing, and a live preview canvas — exactly the page builder UX we'd otherwise build by hand in Blazor.

**How it could work here:** Embed Puck in a standalone React micro-frontend served at `/admin/page-editor/*`, communicating with the ASP.NET Core backend via API endpoints. The Blazor admin handles everything else (events, CRM, orders, settings); Puck handles the visual page builder. This avoids the hardest part of the Blazor admin build (drag-and-drop block editing with live preview) while keeping the rest of the admin in Blazor where it belongs.

**Trade-offs:**
- **Pro:** Saves potentially weeks of Blazor drag-and-drop UI work. Puck's editor UX is polished and battle-tested.
- **Pro:** MIT license — no copyleft concerns.
- **Pro:** Block definitions are just React components with a config schema. Map them 1:1 to C# block types.
- **Con:** Introduces React/Node into the build chain for one feature. You now have two component models (Blazor + React).
- **Con:** Data flow between Puck's JSON output and EF Core entities needs a clean serialization layer.
- **Con:** If the rest of the admin is Blazor, navigating to a React-based page editor feels like a context switch.

**Verdict:** Don't decide now. Build the Blazor block editor first with basic reordering (MoveUp/MoveDown buttons, no drag-and-drop). If the UX feels inadequate and the team wants a more visual editing experience, Puck is the escape hatch. It's far easier to adopt Puck later than to rip it out.

### Initial Block Library (MVP)

| Block | Description |
|---|---|
| `HeroBlock` | Full-width banner with heading, subtext, 0–3 CTA buttons, optional background image |
| `TextColumnsBlock` | 1–4 columns of rich text with configurable layout presets |
| `CardGridBlock` | Grid of cards — image, heading, body, optional CTA |
| `IconGridBlock` | Grid of icon + overline + heading + body items |
| `MixedContentRowBlock` | Arbitrary column slots with width fractions and content types |
| `ImageTextBlock` | Image beside text with `image-left` / `image-right` variant |
| `EventsListBlock` | Pulls from Events — featured/upcoming/filtered views |
| `SponsorsGridBlock` | Tiered logo grid with optional carousel |
| `TestimonialsBlock` | Rotating quotes with attribution |
| `CtaBannerBlock` | Full-width call to action |
| `NewsFeedBlock` | Pulls from Posts — card layout with category badges |
| `StatsBarBlock` | Row of statistics/numbers with labels |
| `ContactFormBlock` | Configurable contact form |
| `MembershipTiersBlock` | Displays membership levels with pricing |
| `MapEmbedBlock` | Embedded map with address overlay |

### Rich Text Strategy

Rich text fields (block body text, event descriptions, post content) use **TipTap** editor in the Blazor admin, integrated via JS interop. TipTap stores content as JSON (ProseMirror document model). On the public site, a `RichTextRenderer` service converts the JSON to HTML server-side — no client-side JS needed for rendering.

```csharp
public class RichTextRenderer : IRichTextRenderer
{
    public string ToHtml(JsonDocument content)
    {
        // Walk the ProseMirror node tree, emit HTML
        // Handles: paragraphs, headings, bold, italic, links, lists, images
    }
}
```

This keeps the public site JS-free for content rendering while giving the admin a best-in-class editing experience.

---

## Domain Model (Entities)

### `Page`
- Id (Guid), Title, Slug (unique, indexed), Status (Draft/Published)
- SEO: MetaTitle, MetaDescription, MetaImageId
- Navigation: Blocks (collection of Block entities, ordered by SortOrder)
- Timestamps: CreatedAt, UpdatedAt, PublishedAt

### `Event`
- Id, Title, Slug, Description (rich text JSON), Location, StartDate, EndDate
- FeaturedImageId (FK to MediaFile)
- `IsChamberEvent` (bool) — flags events hosted by the Chamber itself
- `TicketingMode` (enum): `None` / `ExternalLink` / `ChamberManaged`
  - `None` — informational listing only
  - `ExternalLink` — links to a third-party ticketing page
  - `ChamberManaged` — Chamber sells tickets through Chamber OS
- `ExternalTicketUrl` (only for ExternalLink mode)
- `ServiceFeeType` (enum): `None` / `Percentage` / `Flat`
- `ServiceFeeAmount` (decimal)
- Status: Draft / Published / Cancelled
- `TicketTypes` (owned collection):
  - Name, Description, PriceCents (int), Capacity (int?), SaleStart, SaleEnd
- `EventTemplateId` (optional FK to EventTemplate)

### Event Templates

`EventTemplate` — shared blueprint for recurring event series:
- SeriesName, DefaultDescription, DefaultFeaturedImageId, DefaultLocation
- DefaultTicketingMode, DefaultServiceFeeType, DefaultServiceFeeAmount
- DefaultIsChamberEvent, DefaultTicketTypes (JSON or owned collection)

When creating an event from a template, the service copies defaults into a new Event entity. The event owns its own data — changing the template doesn't alter past events.

### `Order`
- Id, EventId (FK), TicketTypeName, Quantity
- PurchaserName, PurchaserEmail
- StripePaymentIntentId, Status (Pending/Confirmed/Refunded)
- QrCodeToken (Guid, generated on confirmation)
- AmountCents, ServiceFeeCents
- Timestamps

### `Member`
- Id, FirstName, LastName, Email, Phone
- BusinessName, Website, Address (value object)
- SocialLinks (owned collection of SocialLink value objects)
- MembershipTierId (FK), Status (Active/Lapsed/Pending)
- RenewalDate, Notes (rich text JSON)
- IdentityUserId (FK to ApplicationUser, nullable — linked when member portal account is created)

### `MembershipTier`
- Id, Name, AnnualPriceCents, SortOrder
- Features (List<string> stored as JSON)
- StripePriceId (for recurring billing)

### `TeamMember`
- Id, Name, Title, Bio, HeadshotId (FK to MediaFile)
- Type (Staff/Board), SortOrder

### `Post`
- Id, Title, Slug, Content (rich text JSON), Excerpt
- FeaturedImageId, PublishedAt, AuthorId
- Categories (many-to-many)
- Status (Draft/Published)

### `MediaFile`
- Id, Filename, MimeType, FileSize, Width, Height
- StoragePath (relative path or S3 key)
- AltText, Caption
- CreatedAt

### `SiteSettings` (singleton)
- SiteName, LogoId (FK to MediaFile), Tagline
- Contact: Address, Phone, Email
- SocialLinks (owned collection)
- Theme: PrimaryColor, SecondaryColor, AccentColor, HeadingFont, BodyFont
- Analytics: GoogleAnalyticsId, GtmContainerId, CustomHeadScripts

### `NavigationItem`
- Id, Label, Url, PageId (optional FK for internal links)
- Location (enum: Header / Footer / Utility)
- ParentId (self-referential FK for dropdowns)
- SortOrder

---

## Authentication & Authorization

### Admin Auth (ASP.NET Core Identity)

Standard Identity with cookie authentication. Role-based:
- **Admin** — full access to everything
- **Editor** — can manage content (pages, posts, media) but not members, orders, or settings
- **Staff** — can manage events, members, orders, but not site settings or page structure

Policy-based authorization on Blazor pages and service methods:

```csharp
[Authorize(Policy = "AdminOnly")]
public class SiteSettingsPage : ComponentBase { }

[Authorize(Policy = "ContentEditor")]
public class PageEditorPage : ComponentBase { }
```

### Member Portal Auth

Same ASP.NET Core Identity system, different user role and different authentication scheme/cookie. Members authenticate at `/members/login` and get a cookie scoped to the member portal paths. They never see or access the admin panel.

```csharp
// In Program.cs
builder.Services.AddAuthentication()
    .AddCookie("AdminScheme", options => { options.LoginPath = "/admin/login"; })
    .AddCookie("MemberScheme", options => { options.LoginPath = "/members/login"; });

// Authorization policies check both the scheme and the role
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOnly", p => p
        .AddAuthenticationSchemes("AdminScheme")
        .RequireRole("Admin"))
    .AddPolicy("MemberAccess", p => p
        .AddAuthenticationSchemes("MemberScheme")
        .RequireRole("Member"));
```

Members and admin users share the same `ApplicationUser` table (Identity) but have different roles and different entry points. The `Member` entity has a nullable `IdentityUserId` FK — it's populated when a member creates their portal account, linking their CRM record to their login.

This is cleaner than the Payload + NextAuth approach where you have two completely separate auth systems that need to be kept in sync.

---

## Payments: Stripe Integration

### Events / Ticketing

Flow:
1. Visitor selects ticket type and quantity on the event page (Razor Page with Alpine.js for interactivity)
2. Form posts to a Razor Page handler that calls `StripePaymentService.CreatePaymentIntent()`
3. Stripe.js renders the payment UI (injected via `<script>` on the checkout page)
4. On success, Stripe fires a `payment_intent.succeeded` webhook
5. Webhook handler (mapped to a minimal API endpoint) calls `OrderService.ConfirmOrder()` — creates the order, generates QR token, sends confirmation email

```csharp
public class StripePaymentService : IPaymentService
{
    private readonly PaymentIntentService _intentService;

    public async Task<string> CreatePaymentIntent(
        Event evt,
        TicketType ticketType,
        int quantity,
        string purchaserEmail)
    {
        var subtotalCents = ticketType.PriceCents * quantity;
        var feeCents = CalculateServiceFee(subtotalCents, evt.ServiceFeeType, evt.ServiceFeeAmount);

        var options = new PaymentIntentCreateOptions
        {
            Amount = subtotalCents + feeCents,
            Currency = "cad",
            ReceiptEmail = purchaserEmail,
            Metadata = new Dictionary<string, string>
            {
                ["eventId"] = evt.Id.ToString(),
                ["ticketType"] = ticketType.Name,
                ["quantity"] = quantity.ToString(),
                ["feeCents"] = feeCents.ToString(),
            },
        };

        var intent = await _intentService.CreateAsync(options);
        return intent.ClientSecret;
    }
}
```

### Member Dues (Phase 2)

- One-time annual payment via Payment Intent, or
- Recurring via Stripe Billing (Subscription + Price)
- Webhook handler updates member Status and RenewalDate

---

## Caching Strategy

### Public Site

The public site is read-heavy and write-rare. Cache aggressively:

- **Output caching** (ASP.NET Core 9): Cache entire rendered pages for anonymous users. Invalidate on content save via cache tags.
- **Memory cache** (`IMemoryCache`): Cache SiteSettings, navigation, and frequently-accessed queries. Invalidated on admin save.
- **Response caching headers**: Set `Cache-Control` for CDN edge caching on static-ish pages.

```csharp
// In DynamicPage.cshtml.cs
[OutputCache(Duration = 300, Tags = ["pages"])]
public class DynamicPageModel : PageModel
{
    public async Task<IActionResult> OnGetAsync(string slug)
    {
        var page = await _pageService.GetPublishedBySlug(slug);
        if (page is null) return NotFound();
        Page = page;
        return Page();
    }
}

// When a page is saved in admin:
public async Task SavePage(Page page)
{
    await _db.SaveChangesAsync();
    _outputCacheStore.EvictByTag("pages");
}
```

### Admin Panel

No output caching — Blazor Server maintains live circuit state. But service-layer queries use `IMemoryCache` for expensive lookups (member search, event aggregations).

---

## Feature Flags & Subscription Tiers

Feature flags live in `appsettings.json` (or environment variables) and are bound to a strongly-typed options class:

```csharp
public class FeatureFlags
{
    public bool Events { get; set; } = true;
    public bool Ticketing { get; set; }
    public bool MemberCrm { get; set; }
    public bool NewsAndBlog { get; set; }
    public bool MemberPortal { get; set; }
    public bool Forums { get; set; }
    public bool Voting { get; set; }
}
```

```json
{
  "Features": {
    "Events": true,
    "Ticketing": true,
    "MemberCrm": true,
    "NewsAndBlog": false
  }
}
```

Consumed via `IOptions<FeatureFlags>` through DI. Admin sidebar items, Razor Pages, and service methods check features before exposing functionality. Disabled features return 404 on the public site and hide from the admin sidebar.

### Suggested Tier Structure

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

---

## Multi-Tenancy / White Label

Same strategy as the Payload version: each deployment is a separate instance. Tenant-specific configuration in `appsettings.json` and environment variables:

```json
{
  "SiteName": "Southern Georgian Bay Chamber of Commerce",
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=sgbcc;..."
  },
  "Stripe": {
    "SecretKey": "sk_live_...",
    "WebhookSecret": "whsec_..."
  }
}
```

A deployment script or README guides spinning up a new client instance. Docker Compose for local dev; container deployment (Azure Container Apps, Fly.io, Railway) for production.

---

## SGBCC: Development Reference Data

Same as the Payload version — the dev instance is seeded with real SGBCC content. A `SeedDataService` runs on first startup (or via CLI command) to populate the database with sample pages, events, members, and media.

- **Organization:** Southern Georgian Bay Chamber of Commerce
- **Region:** Georgian Bay, Ontario, Canada
- **Pain points being replaced:** WordPress + Elementor, janky events plugin, no proper CRM
- **Staff technical comfort level:** Low to moderate

---

## Testing Strategy

### Unit Tests (xUnit + FluentAssertions)

- Domain logic: fee calculations, status transitions, validation rules
- Service layer: mock dependencies with NSubstitute, test business logic
- Rich text renderer: input JSON → expected HTML

### Integration Tests (Testcontainers)

- Spin up a real PostgreSQL container per test class
- Test EF Core queries, migrations, and data access patterns
- Test Stripe webhook handling with recorded webhook payloads

### Component Tests (bUnit)

- Test Blazor admin components in isolation
- Verify block editors render correctly, handle user input, emit save events

### E2E Tests (Playwright)

- Full browser tests against a running instance
- Admin: create page with blocks, verify public rendering
- Public: navigate pages, view events, complete checkout flow
- Member portal: login, view dashboard, update profile

### Test File Conventions

Tests live in separate projects mirroring the source structure:
```
tests/
  ChamberOS.Core.Tests/
    Entities/
      EventTests.cs
      OrderTests.cs
  ChamberOS.Application.Tests/
    Services/
      EventServiceTests.cs
      MemberServiceTests.cs
  ChamberOS.Infrastructure.Tests/
    Data/
      PageRepositoryTests.cs   ← uses Testcontainers
```

---

## Staff UX Principles

Same as the Payload version — these are product principles, not technology choices:

1. **Constrained choices over free-form controls.** Offer variants, not a blank canvas.
2. **Obvious defaults.** New blocks should look good with zero configuration.
3. **Minimal jargon.** Field labels should be plain English, not developer terminology.
4. **Fast.** The admin panel should feel snappy. Blazor Server + SignalR makes this natural.
5. **Recoverable.** Draft/publish workflow so staff can't accidentally nuke the live site.

---

## Future Roadmap

### Member Portal (Phase 2)
- Self-service portal at `/members/*` with own auth cookie
- View/update profile, membership status, payment history
- Download invoices, RSVP to events, purchase tickets

### Member Forums (Phase 3)
- Discussion boards accessible to authenticated members
- Forum threads as "official meetings" with defined open/close dates for governance compliance
- Thread participation logged for quorum tracking
- Email notifications via `IEmailService`

### Voting & Elections (Phase 3–4)
- Motions & resolutions with defined voting windows
- Board elections with nominations, candidate profiles, ranked-choice or plurality
- Democracy in a box — proper governance accessible to small organizations

---

## Design Reference

Same OBOT reference (ottawabot.ca). See `example-ui/` for screenshots. The block library and theming system should be capable of producing this kind of clean, modern design through configuration rather than custom code.

---

## Advantages of the .NET Approach

Let's be honest about the trade-offs:

**What you gain:**
- **Type safety all the way down.** C# entity → EF Core query → service method → Blazor component → Razor partial. No `any` escape hatches, no runtime type errors from JSON deserialization, no "the TypeScript types say one thing but the runtime data is subtly different."
- **One language, one runtime.** No context-switching between TypeScript (frontend), TypeScript-but-slightly-different (Payload config), and TypeScript-but-actually-it's-Node (API routes). It's all C#.
- **Blazor Server for admin is genuinely good.** Real-time interactivity without the weight of a SPA framework. Direct access to server-side services without an API layer. Circuit-based state management that doesn't require Redux/Zustand/whatever the flavor of the month is.
- **EF Core is mature and boring.** Migrations work. Relationships work. Transactions work. You won't spend a day debugging why your SQLite adapter drops a column during a migration and nobody noticed because the test suite only runs against PostgreSQL.
- **Output caching in ASP.NET Core 9 is excellent.** Tag-based invalidation, vary by route/query, middleware-level. The public site will be fast without effort.
- **ASP.NET Core Identity is battle-tested.** One auth system for both admin and member portal, different schemes and cookies. No duct-taping NextAuth alongside Payload's admin auth.
- **No npm.** Okay, you still need it for Tailwind CSS and TipTap. But the build chain is `dotnet build`, not a Rube Goldberg machine of bundlers.

**What you lose:**
- **No free admin CRUD.** Payload gives you list views, edit views, filtering, sorting, and relationship management for free. In .NET, you build every admin page by hand. This is a *lot* of work for the initial build, even if the result is better long-term.
- **No free rich text integration.** Payload ships with Lexical built in. You're doing TipTap-via-JS-interop, which works but requires more glue code.
- **No free draft/preview system.** Payload's draft/preview is built in. You'll implement versioning and preview yourself (not hard, but not free).
- **Smaller ecosystem for CMS-adjacent tooling.** Payload has plugins for SEO, redirects, nested docs. You'll build those features from scratch or find .NET equivalents (which are fewer and less polished).
- **Blazor Server's connection model.** Each admin user holds a SignalR connection. Fine for 5 staff members, less fine if you somehow end up with 500 concurrent admin users (you won't).

**The honest assessment:** If this project were 80% CMS and 20% business logic, Payload + Next.js would be the clear winner — you'd get the admin panel for free and only build the 20%. But Chamber OS is 40% CMS, 40% business platform, and 20% member portal. For that split, ASP.NET Core's structural advantages (unified type system, single auth, queryable relational model) may outweigh the cost of building the admin CRUD by hand.

The real question is: do you want to spend your time fighting Payload's opinions about how admin UIs should work, or do you want to spend it building admin UIs from scratch? Both are real work. Pick the kind of work you'd rather do.

---

## Current State

This is a greenfield project. Nothing exists yet. Start from `dotnet new` and build forward.

**Start here:**
1. Create the solution structure (Core, Infrastructure, Application, Admin, Web)
2. Define the core entities: Page, Block (with HeroBlock), SiteSettings, MediaFile
3. Set up EF Core with SQLite for dev, seed data service
4. Build the SiteSettings admin page in Blazor (theme config, branding)
5. Build a minimal page editor with HeroBlock support
6. Build the public site rendering pipeline (DynamicPage → BlockRenderer → partials)
7. Add the remaining block types one at a time
8. Define Events, Members, Orders entities
9. Build event management and member CRM admin pages
10. Integrate Stripe for ticketing
11. Build the member portal

---

## Notes for the Agent

- **This is not a CMS project.** Don't reach for CMS frameworks (Orchard Core, Piranha, etc.). We're building a purpose-built business platform that includes a page builder. The page builder is a feature, not the product.
- **Clean Architecture is fine, but don't over-engineer.** The project structure above uses a sensible layered architecture. Don't add CQRS, MediatR, or event sourcing unless the complexity genuinely warrants it. Chamber OS is a CRUD-heavy business app — service classes calling EF Core is the right level of abstraction.
- **Blazor Server is for admin only.** The public site is Razor Pages. Do not build the public site in Blazor — it will hurt SEO, hurt performance, and add unnecessary complexity.
- **TipTap via JS interop is the rich text strategy.** Don't try to build a rich text editor in pure Blazor — it's a bad idea and Blazor's strengths are not in text editing. Use TipTap, store JSON, render server-side.
- **EF Core configurations go in the Configurations folder, not on the entities.** Keep entities clean — no `[MaxLength]` attributes cluttering the domain. Use Fluent API in `IEntityTypeConfiguration<T>` classes.
- **Test the service layer.** Domain logic and service methods get xUnit tests. Razor Pages and Blazor components get tested via Playwright E2E. The middle (service layer) is where the value of unit tests is highest.
- **CSS uses Tailwind for layout, CSS custom properties for theme values.** Same as the Payload version. The tech stack changes; the design system doesn't.
- Keep Stripe logic in `ChamberOS.Infrastructure/Payments/`. Don't scatter Stripe SDK calls across page models.
- Every entity should have sensible cascading deletes and referential integrity from the start.
- Use `record` types for DTOs and value objects. Use `class` for entities with identity.
- Prefer `DateTimeOffset` over `DateTime` for all temporal fields.
- All money amounts are stored as `int` (cents), not `decimal`. Floating point money is a bug waiting to happen.
