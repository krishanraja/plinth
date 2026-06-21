# Product

## Vision
Plinth is the product-data primitive for the agent era. When an agent has
decided to buy, find, compare, or summarise a physical good, it should be
able to ask one API a typed question and get a typed answer, with a
confidence it can reason about and a cost it can pay for itself.

## The five wedges
See [README.md](./README.md). These are the non-negotiables. Every PR,
every section of copy, every demo, every objection handler should ladder
to at least one of them.

## Target users

- **Devs building agent buy-flows.** Comparison sites, affiliate stacks,
  procurement agents, in-house "buy this for me" copilots. They have a
  schema in mind and want one vendor, not three.
- **Autonomous agents.** Discover via the MCP directory, call
  `read_product`, settle in USDC over x402. No human in the loop.
- **Commerce infra teams.** Marketplaces and CRMs enriching their own
  catalogue.

## Jobs to be done

1. "Turn this URL into a product object I can trust."
2. "Find this barcode."
3. "Find the canonical product behind this fuzzy string."
4. "Tell my agent what a thing costs, with enough signal to decide."
5. "Let my agent pay for this itself."

## Non-goals (v1)

- Live order placement, checkout, or fulfilment.
- Stock or inventory feeds.
- Reviews aggregation as a primary product.
- Image generation, copy rewriting, marketing assets.
- A scraper-as-a-service for non-product pages.

## Roadmap

**Shipped and live (2026-06-21):** marketing site, dashboard (keys, usage, billing, overview),
auth, single secret API key (`plk_`), all four tools live over REST (`read_product`,
`resolve_product`, `compare_products`, `brief_product`) plus `read_product` and `resolve_product`
over MCP, the extraction worker with confidence scoring and price bands, per-plan rate limiting,
usage metering, Stripe billing (checkout + portal + webhook, verified to live Stripe), x402
settlement on Base Sepolia (facilitator verify and settle, full flow proven), full data model with
RLS, `/api/health`, CI, and interim legal pages.

**Deferred:** mainnet x402, outbound webhooks (no async events yet in the sync-tool v1), SDKs
(TS first, then Python), `compare_products` / `brief_product` over MCP, regional caches, and the
async `resolve_product` job model.

**Founder-gated before paid GA:** counsel review of the interim legal, the paid-GA flip, and a
completed test payment to confirm the subscription-activation webhook.

## Success metrics

The North Star and stop conditions are the decision record in
[../docs/KILL-CRITERIA.md](../docs/KILL-CRITERIA.md). In short:

- **North Star:** weekly high-confidence (>= 0.7) calls per active account.
- **Activation:** time from sign-in to first 200 on `read_product`. Target under 3 minutes.
- **Retention:** week-over-week repeat rate.
- **Monetization:** free to paid conversion at the included-call cap; agent share of revenue via
  x402 (at mainnet).
- **Quality:** trust rate (share at or above 0.7), cache hit rate, takedowns per week.

---
Last reviewed: 2026-06-21.
