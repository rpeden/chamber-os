/**
 * Stripe integration barrel export.
 *
 * Server-side Stripe client, Payment Intent creation, and
 * supporting types for the checkout flow.
 */
export { getStripe } from './client'
export { createPaymentIntent } from './create-payment-intent'
export type { CreatePaymentIntentInput, PaymentIntentResult } from './create-payment-intent'
