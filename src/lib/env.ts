import { z } from 'zod'

/**
 * Validated environment variables for the application.
 *
 * Parsed at import time — if any required var is missing or malformed,
 * the process will crash immediately with a clear error message rather
 * than failing mysteriously at runtime.
 */
const envSchema = z.object({
  /** Database connection string (SQLite file path for dev, Postgres URL for prod) */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  /** Payload secret — used for JWT signing, must be at least 32 chars */
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 characters'),

  /** Optional: Cron secret for authenticating scheduled job requests */
  CRON_SECRET: z.string().optional(),

  /** Public-facing base URL of the site */
  NEXT_PUBLIC_SERVER_URL: z.string().url().optional(),

  /** Stripe secret key — required for ticketing (Phase 11) */
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),

  /** Stripe webhook signing secret */
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  /** Google Analytics measurement ID */
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  /** Google Tag Manager container ID */
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'))
    throw new Error('Invalid environment variables')
  }

  return result.data
}

export const env = parseEnv()
