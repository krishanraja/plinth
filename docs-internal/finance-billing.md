# Finance & Billing

## Stripe SKUs

| Plan    | Stripe product       | Monthly price | Included calls | Overage  |
| ------- | -------------------- | ------------- | -------------- | -------- |
| Free    | `plinth_free`        | $0            | 1,000          | $0.01    |
| Starter | `plinth_starter_v1`  | $29           | 5,000          | $0.01    |
| Growth  | `plinth_growth_v1`   | $199          | 50,000         | $0.005   |
| Custom  | `plinth_custom_*`    | quote         | quote          | quote    |

**Status (2026-06-21):** live products and prices exist in Stripe (Starter
`price_1Tki9C4w6vAdI2o574L46LZW`, Growth `price_1Tki9I4w6vAdI2o5NtBRlfk6`), wired to
`plans.stripe_price_id`. Checkout, the billing portal, and the signature-verified webhook are live;
checkout was browser-verified end to end against live Stripe. Subscriptions are flat monthly in v1.
Usage is metered into `usage_events`, but overage is **not yet auto-billed** to Stripe (metered
usage reporting is a follow-up); the formula below is the intended model. Free does not require a
card.

## Overage formula

```
overage_cost = max(0, billable_calls - included_calls) * overage_rate
billable_calls = live_calls + (cached_calls * 0.1)
```

A cached read counts as 1/10 of a live extraction. This is also how
rate limits weight calls.

## x402 settlement

- **Status:** live on **Base Sepolia** (beta), settled per call to `X402_RECIPIENT` via the x402
  facilitator (verify then settle). The full buyer to facilitator to settle flow is proven; mainnet
  at GA.
- Per-call USDC, settled directly to `X402_RECIPIENT`. We do not custody funds.
- We do not credit a Stripe account when a customer pays over x402; the two payment paths are
  independent.
- For accounting, x402 revenue is reconciled from on-chain settlement events (each call's
  `X-PAYMENT-RESPONSE` carries the tx hash).

## Invoicing

- Stripe invoices are mirrored to the `invoices` table for in-app
  history.
- Custom plans get a manual invoice via Stripe.
- Tax: collected via Stripe Tax once domiciled.

## Revenue recognition

- Subscription: monthly straight-line.
- Overage: at invoice date.
- x402: at settlement.
- Custom annuals: ratable over the term.

## COGS

Per-call extraction cost is logged on every `usage_event`
(`cost_internal_usd`, server-only column). Margin = `cost_usd` (the
price stamped in the response) minus `cost_internal_usd`. Watch the
weekly weighted margin in admin; investigate if it drops below 60%.

## Refunds

See [support.md](./support.md). Process via Stripe; mirror to `invoices`.

---
Last reviewed: 2026-06-21.
