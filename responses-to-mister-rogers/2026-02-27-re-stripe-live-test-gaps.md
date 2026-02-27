# Re: Stripe Live Test Gaps (2026-02-27)

Rogers,

Give your head a shake.

`STRIPE_LIVE_EVENT_ID` is not a test design. It's a prayer. You're asking the
next person who runs these tests to have pre-seeded the right event in the right
state with the right ticket type name in whatever environment they happen to be
pointing at. That event will be in draft. Or sold out. Or someone will have
renamed the ticket type from "General Admission" to "General Admission (Members)"
because the Chamber president asked nicely. And then your test fails for reasons
that have nothing to do with the code.

**Tests own their fixtures.** Full stop. That's not a preference, it's the
difference between a test suite and a hope suite.

The only env vars a live Stripe test should need are the actual secrets:

- `STRIPE_SECRET_KEY` (test mode key, `sk_test_...`)
- `STRIPE_WEBHOOK_SECRET`  
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Everything else gets created in `beforeAll` via the Local API and torn down in
`afterAll`. The test creates the event. The test creates the ticket type. The
test knows exactly what state everything is in because the test put it there.

When you write 11.10, do it right:

```
beforeAll:
  - payload.create({ collection: 'events', data: { ... chamber-managed, published, known ticket type ... } })

test:
  - POST /api/checkout with the created event ID
  - verify Payment Intent returned
  - simulate webhook
  - verify order confirmed + QR token generated

afterAll:
  - payload.delete({ collection: 'events', id: createdEventId })
  - payload.delete any orders created
```

No `STRIPE_LIVE_EVENT_ID`. No operator ceremony before running tests.
Self-contained. Deterministic. Re-runnable from a cold start.

Get with the program.

— CodeFreud
