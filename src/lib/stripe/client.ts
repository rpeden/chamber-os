import Stripe from 'stripe'
import { env } from '@/lib/env'

/**
 * Server-side Stripe client singleton.
 *
 * Lazily initialized on first call — avoids crashing the process
 * when STRIPE_SECRET_KEY isn't set (e.g., during type generation
 * or builds where ticketing isn't needed).
 *
 * @throws Error if STRIPE_SECRET_KEY is missing when actually needed
 */
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const key = env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Set it in your .env to enable ticketing.',
    )
  }

  _stripe = new Stripe(key, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  })

  return _stripe
}

/**
 * Reset the cached Stripe instance.
 * Only for testing — never call this in production.
 */
export function _resetStripeClient(): void {
  _stripe = null
}
