# Support

## Common tickets

### "I lost my API key"

Keys are shown once and stored hashed. We cannot recover the original.
Have the customer create a new key and revoke the old one. Offer a
24-hour grace period on the old key for migration.

### "My usage / overage looks wrong"

1. Pull `usage_events` for the period.
2. Compare to the Stripe invoice line items.
3. If discrepancy < 1%, explain rounding.
4. If larger, escalate to engineering with the key id and time range.

### "Webhook isn't firing"

1. Check `webhook_deliveries` for the event id.
2. If retries failed: customer endpoint returned non-2xx. Share the
   captured response excerpt.
3. If no row: confirm the event type is in the subscription.
4. Re-deliver from admin.

### "Confidence is too low / I'm getting 422"

Confidence < 0.7 means we don't trust the result enough to cache or
return. Options: pass `min_confidence=0.5` (when shipped) to override,
or provide a better reference (URL beats fuzzy name beats GTIN-only).

### "x402 payment failed"

1. Confirm network (Base Sepolia for v1).
2. Confirm asset is USDC.
3. Check the recipient matches `X402_RECIPIENT`.
4. If on mainnet, check facilitator status.

## Canned responses

Live in the support inbox templates. Keep them short, factual, and
free of em dashes (see design.md).

## Escalation

| Severity | Definition                                         | Who                                |
| -------- | -------------------------------------------------- | ---------------------------------- |
| P0       | API down, billing wrong, data leak                 | Page on-call, status page update   |
| P1       | Single customer blocked, no workaround             | Reply within 4 business hours      |
| P2       | Bug with workaround                                | Reply within 1 business day        |
| P3       | Feature request / docs gap                         | Triage weekly                      |

## Refund policy (stub)

Full refund for documented platform errors (downtime, billing bugs).
No refund for low-confidence calls (they are part of the product).
Pro-rata refund on cancellation if customer requests within 30 days
of an annual plan.

---
Last reviewed: 2026-06-17.
