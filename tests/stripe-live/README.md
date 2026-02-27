# Stripe Live Tests

These tests are intentionally slow and are **not** part of default test runs.

## Purpose

Validate the real checkout -> Stripe API (test mode) -> webhook -> order confirmation lifecycle using your app endpoints.

These tests are **self-fixturing**:
- create their own chamber-managed published event in `beforeAll`
- create a pending order via `/api/checkout`
- confirm payment via Stripe API test mode
- verify webhook-driven order confirmation
- clean up event + orders in `afterAll`

## Preconditions

- App running and reachable at `STRIPE_LIVE_BASE_URL` (default: `http://127.0.0.1:3000`)
- Stripe test mode configured
- Webhook delivery configured to your app's `/api/webhooks/stripe` endpoint

## Required env vars

- `RUN_STRIPE_LIVE=1`
- `STRIPE_SECRET_KEY` (`sk_test_...`)
- `STRIPE_WEBHOOK_SECRET` (`whsec_...`)

## Optional env vars

- `STRIPE_LIVE_BASE_URL` (default `http://127.0.0.1:3000`)
- `STRIPE_LIVE_PURCHASER_NAME` (default `Stripe Live Test`)
- `STRIPE_LIVE_PURCHASER_EMAIL` (default `stripe-live-test@example.com`)
- `STRIPE_LIVE_QUANTITY` (default `1`)
- `STRIPE_LIVE_TIMEOUT_MS` (default `60000`)
- `STRIPE_LIVE_POLL_INTERVAL_MS` (default `1500`)

## Run

```bash
pnpm test:stripe:live
```

## Notes

- The test creates a real test-mode Payment Intent via your **checkout API**.
- It confirms payment via Stripe API (`pm_card_visa`) in test mode.
- It polls for order status transition to `confirmed` (webhook-driven).
