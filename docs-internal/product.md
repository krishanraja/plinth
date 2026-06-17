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

**Shipped in v1 scope:** marketing site, dashboard, magic-link auth,
single secret API key (plk_), waitlist + approval gate, REST stubs for
`read_product` and `resolve_product`, MCP route with x402 on Base
Sepolia, full data model with RLS, admin shell, docs.

**Deferred:** `compare_products`, `brief_product`, mainnet x402,
mobile-first dashboard, SDKs (TS first, then Python), regional caches.

## Success metrics

- **Activation:** time from sign-in to first 200 OK on `read_product`.
  Target: < 3 minutes.
- **Retention:** weekly resolves per active account.
- **Monetization:** free → paid conversion at the 1k-call cap; agent
  share of revenue via x402 (mainnet).
- **Quality:** cache hit rate; share of responses ≥ 0.7 confidence;
  takedown count / week.

---
Last reviewed: 2026-06-17.
