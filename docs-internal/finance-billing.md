# Finance & Billing

## Stripe SKUs

| Plan    | Stripe product       | Monthly price | Included calls | Overage  |
| ------- | -------------------- | ------------- | -------------- | -------- |
| Free    | `plinth_free`        | $0            | 1,000          | $0.01    |
| Starter | `plinth_starter_v1`  | $29           | 5,000          | $0.01    |
| Growth  | `plinth_growth_v1`   | $199          | 50,000         | $0.005   |
| Custom  | `plinth_custom_*`    | quote         | quote          | quote    |

Free requires a card on file. Overage is auto-billed on the same
invoice as the subscription line.

## Overage formula

```
overage_cost = max(0, billable_calls - included_calls) * overage_rate
billable_calls = live_calls + (cached_calls * 0.1)
```

A cached read counts as 1/10 of a live extraction. This is also how
rate limits weight calls.

## x402 settlement

- Per-call, settled to `X402_RECIPIENT` on Base.
- We do not credit a Stripe account when a customer pays over x402;
  the two payment paths are independent.
- For accounting, x402 revenue is reconciled monthly from on-chain
  events tagged with the call's `request_id`.

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
Last reviewed: 2026-06-17.
