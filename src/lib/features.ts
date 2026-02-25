/**
 * Feature flags for Chamber OS.
 *
 * These control which functionality is visible and available in the admin
 * and on the frontend. Features can be toggled per-deployment, allowing
 * the same codebase to power simple brochure sites and full-featured
 * association management platforms.
 *
 * For now these are hardcoded constants. In a future phase, they'll be
 * driven by a `site-settings` global field so Chamber admins can toggle
 * features without a redeploy.
 */
export const features = {
  /** Event management (listings, detail pages, ticketing) */
  events: false,

  /** News / blog posts */
  news: true,

  /** Member directory and portal */
  memberPortal: false,

  /** Stripe-powered ticket sales */
  ticketing: false,

  /** Sponsor/partner logo grids */
  sponsors: false,

  /** Team / staff / board directory */
  team: false,

  /** Built-in lightweight page view tracking */
  analytics: false,

  /** Forum / discussion boards */
  forums: false,

  /** Voting and elections */
  voting: false,
} as const

export type FeatureFlag = keyof typeof features
