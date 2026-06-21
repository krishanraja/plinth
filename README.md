# Plinth

Typed product data for software agents. One call turns a product URL, a GTIN barcode, or a fuzzy
product name into a typed product object with per-field confidence, a price expressed as a band,
the source method, and the per-call cost stamped in the response. It is exposed over both REST and
MCP, and payable either with an API key or per call in USDC over x402.

**Status: live.** App at https://plinth-tan.vercel.app (custom domain `onplinth.io` provisioning).
All four tools, key auth, usage metering, per-plan rate limiting, the dashboard, Stripe billing, and
x402 settlement on Base Sepolia are deployed. Private beta.

## Why Plinth (the five wedges)

1. **MCP-native, with x402 micropayments.** The same tools an agent can discover over MCP, payable
   in USDC on Base per call, with no human signup.
2. **Cost stamped in every response** (`cost_usd`). No opaque credit bundles.
3. **Per-field confidence with a 0.7 cache gate.** Only trusted results are cached and returned.
4. **Price as a band, not a number:** `{ low, high, currency, as_of, n_sources }`.
5. **One typed schema across URL, GTIN, and fuzzy name.**

## Quickstart

1. Sign in at https://plinth-tan.vercel.app and create an API key (`plk_...`) in the dashboard. The
   full key is shown once.
2. Call `read_product`:

   ```bash
   curl -X POST https://plinth-tan.vercel.app/api/v1/read_product \
     -H "authorization: Bearer plk_your_key" \
     -H "content-type: application/json" \
     -d '{"url":"https://www.allbirds.com/products/mens-wool-runners-natural-grey"}'
   ```

3. You get back a typed product, `field_confidence`, an overall `confidence`, a price band,
   the `method`, and `cost_usd`.

## Tools

| Tool               | Input                       | Returns                                              |
| ------------------ | --------------------------- | ---------------------------------------------------- |
| `read_product`     | `url` XOR `gtin`            | typed product, per-field + overall confidence, price band, cost |
| `resolve_product`  | `name`                      | best-match product via neural search (Exa) then extraction |
| `compare_products` | `urls` (2 to 5)             | side-by-side matrix plus the price delta             |
| `brief_product`    | `url` XOR `gtin` XOR `name` | typed product plus a short agent-readable brief      |

REST: `POST /api/v1/<tool>`. MCP: `POST /api/mcp` exposes `read_product` and `resolve_product`.

## Auth

- **API key:** `Authorization: Bearer plk_...`. Create and revoke in the dashboard. Keys are
  sha256-hashed at rest and shown once.
- **x402 (agents, no key):** MCP discovery is free. `tools/call` returns HTTP 402 with payment
  requirements; the agent pays in USDC on Base Sepolia, resends with an `X-PAYMENT` header, and the
  facilitator verifies and settles. See [docs-internal/api.md](./docs-internal/api.md).

## Billing

Free, Starter ($29/mo), and Growth ($199/mo), via Stripe. Usage is metered per call; a cached read
is weighted at 1/10 of a live extraction. Subscribe and manage from the dashboard `/dashboard/billing`.

## Architecture (short version)

- **This repo:** the TanStack Start app (marketing site, dashboard, REST `/api/v1/*`, MCP `/api/mcp`,
  Stripe billing). Deployed on Vercel (Node / Fluid Compute functions).
- **Extraction worker:** a separate deploy (`krishanraja/plinth-worker`) that does the real
  extraction (JSON-LD, OpenGraph, Shopify, barcode, headless render) and scores confidence. The app
  proxies tool calls to it.
- **Data:** Supabase (project `cgkcplcamsijghalintq`): keys, usage, plans, subscriptions, cache.
- **Health:** `GET /api/health`.

Full detail is in [`docs-internal/`](./docs-internal/README.md): engineering, data-model, api,
finance-billing, ops, security, legal-trust, and the kill-criteria in [`docs/KILL-CRITERIA.md`](./docs/KILL-CRITERIA.md).

## Development

```bash
bun install
bunx tsc --noEmit     # typecheck
bun run build         # build (also regenerates routeTree.gen.ts)
bun run lint          # eslint
```

Workflow: branch, PR, green CI (install, em-dash check, tsc, build), squash-merge. Vercel
auto-deploys `main` and builds previews on PRs. House style: no em dashes (CI enforces this on
`src/`).
