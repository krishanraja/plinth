# Plinth: North Star and kill criteria

Decision record for the private beta. This is the bar Plinth must clear to keep going, and the
signals that say stop. Metrics come from `usage_events` and the `subscriptions` table.

## North Star

**Weekly count of high-confidence calls per active account.** A call counts if it returned a
product object at or above the 0.7 trust gate. An account is active in a week if it made at least
one call that week.

Target for the beta: a typical active account makes **7 or more** high-confidence calls per week
(roughly one per day). That signals the data is trusted enough to wire into a real workflow, which
is the whole thesis.

## Supporting metrics

- **Trust rate**: share of calls returning at or above 0.7. Below ~0.6 means the extraction or
  confidence model is not earning trust. Track by source method (jsonld, shopify, barcode, render).
- **Repeat rate**: share of accounts that call in week N and again in week N+1. A leaky bucket here
  means the output is not useful enough to come back for.
- **Cache hit rate**: share of cached reads. High is good for margin; very low means the corpus is
  too sparse to amortize.
- **Cost per trusted call**: extraction cost divided by calls at or above 0.7. Must stay well under
  the price charged (Stripe metered or x402 per call).

## Kill criteria

Reconsider the product if, after eight weeks of beta with at least ten active accounts:

1. Median active account is below **3** high-confidence calls per week and not trending up, **and**
2. Week-over-week repeat rate stays below **30 percent**, **and**
3. Trust rate cannot be pushed above **0.6** without gaming the confidence score.

All three together means accounts try Plinth, do not trust the output, and do not return. That is a
thesis failure, not a tuning problem, and is the signal to stop rather than keep polishing.

## What is explicitly not a kill signal

- Low raw call volume early (private beta, small N).
- A single noisy source (fix the source, not the product).
- x402 settlement volume near zero in beta (the wedge is discovery and trust first; settlement
  follows once agents depend on the data).
