# Sales

## ICP

1. **Agent buy-flow devs.** Building "buy this for me", procurement
   copilots, comparison agents. 1 to 20 engineers. Already paying for
   one or two of: Diffbot, Firecrawl, ScrapingBee, headless infra.
2. **Commerce infra teams.** Marketplaces, affiliate networks,
   comparison sites enriching their own catalogue.
3. **Autonomous agent platforms.** Stacks shipping MCP servers and
   looking for paid tools.

## Qualifying questions

- What's the trigger that makes you call us instead of a scraper?
- How do you handle confidence today? (If "we don't", that's our wedge.)
- Who pays per call: a human with a card, or an agent over x402?
- What's your tolerance for stale price? (Sets the cache TTL story.)
- Do you need MCP, REST, or both?

## Top objections

**"Diffbot already does this."**
Diffbot returns a typed object. It does not score confidence per field,
does not stamp cost in the response, has no MCP surface, and does not
accept x402. An agent cannot discover Diffbot and pay on its own.

**"We'll just use Firecrawl + GPT-4."**
You can. You then own: the schema, the cache, the confidence rubric,
the price-band semantics, the barcode merge, the MCP server, and the
x402 settlement. We are that stack, finished, behind one call. The
cost on every response makes the build-vs-buy maths trivial.

**"Why should I trust a confidence number?"**
Because we tell you per field. You can hard-gate at 0.9 on `gtin` and
accept 0.6 on `category`. Most vendors give you one number or none.

**"Base Sepolia / x402 sounds risky."**
v1 is testnet. Mainnet flips at GA. You can ignore x402 entirely and
pay with a card. The agent surface is opt-in.

**"What about Bright Data / Apify?"**
Different shape. They sell access to crawlers; we sell typed answers.
Customers using them as data sources are a good fit.

## Pricing tiers

- **Free:** card required, 1k calls/mo, $0.01 overage. Anti-abuse, not
  a real plan.
- **Starter ($29/mo):** 5k calls, $0.01 overage, webhooks.
- **Growth ($199/mo):** 50k calls, $0.005 overage, higher limits,
  Slack channel, SLA.
- **Custom:** quote on > 250k calls/mo or any on-prem extractor request.

## Demo script (5 min)

1. `curl read_product` on a real product URL → typed object, confidence,
   cost.
2. Same call to MCP server with no key → 402 with payment instructions.
3. Pay over x402 (testnet) → same response.
4. Show dashboard: one usage event, one cost line, one cached toggle.
5. Show docs (`/docs/api/read-product` and `/docs/mcp`).

---
Last reviewed: 2026-06-17.
