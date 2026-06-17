# Glossary

**Agent.** A program that reasons and acts without a human in the loop
for each step. Plinth treats agents as first-class callers: discoverable
via MCP, paying via x402.

**Band price.** Price returned as `{ low, high, currency, as_of, n_sources }`
instead of a single number. Plinth refuses to present a single scraped
price as truth.

**Cache (product_cache).** Server-side store of typed product objects,
keyed by normalised input. TTL: 7 days default, 1 hour for volatile
fields. Entries with overall confidence < 0.7 are NOT written.

**Confidence.** Overall score from 0 to 1, plus per-field scores. The
threshold for caching and for trusting a response is policy, not
arithmetic; we surface the number and let the caller decide.

**GTIN.** Global Trade Item Number. The 8/12/13/14-digit barcode.
Plinth's `read_product` accepts `gtin` instead of `url`.

**MCP.** Model Context Protocol. A discovery and call protocol for
LLM-driven agents. Plinth exposes `read_product` and `resolve_product`
over MCP at `/api/mcp`.

**plk_ key.** Customer API key with `plk_` prefix. sha256-hashed at
rest, shown ONCE at creation.

**Resolve vs read.** `read_product` takes a precise reference (URL or
GTIN) and returns synchronously. `resolve_product` takes a fuzzy
string and returns asynchronously (poll or webhook).

**Schema.org superset.** Our product object is a strict superset of
schema.org Product. We add `confidence`, `field_confidence`, `source`,
`cost_usd`, and a band-shaped `price`.

**Stamped cost.** The `cost_usd` field returned in every response.
Lets an agent budget and decide whether to keep calling.

**Wedge.** One of the five differentiators in [README.md](./README.md).
If a piece of copy or a product decision does not ladder to a wedge,
ask why we're shipping it.

**x402.** Open HTTP 402 micropayment standard. Plinth accepts USDC on
Base (Sepolia in v1, mainnet at GA).

---
Last reviewed: 2026-06-17.
