# Stripe Live Test Gaps (2026-02-27)

## Important missing items

1. Checkout API response does not include `paymentIntentId`.
- Current behavior: `/api/checkout` returns `clientSecret`, amounts.
- Test impact: Live test must parse PI ID from `client_secret` (`pi_xxx_secret_...`) which is workable but more brittle than using explicit `paymentIntentId`.

2. No explicit guaranteed test fixture for event/ticket in test env.
- Current behavior: live test needs `STRIPE_LIVE_EVENT_ID` and `STRIPE_LIVE_TICKET_TYPE` supplied.
- Test impact: test depends on operator-managed fixture data.

3. Webhook transport setup is external to test runner.
- Current behavior: requires Stripe dashboard endpoint or local forwarding setup.
- Test impact: live test can validate lifecycle but cannot self-provision webhook transport.

## Guidance requested before implementation continues

The `paymentIntentId` omission is significant for test design.

Preferred path needed:
- A) Keep app code unchanged and parse PI ID from `clientSecret` in live tests.
- B) Update checkout API contract to include `paymentIntentId` and use that directly in live tests.

Per testing-agent constraints, application code should not be modified without explicit direction.
