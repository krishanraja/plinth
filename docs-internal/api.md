# API (internal reference)

The contract and the trade-offs behind it. All four tools are live in production.

## Surfaces

- **REST** for developers: `POST /api/v1/<tool>`, auth via `Authorization: Bearer plk_...`.
- **MCP** for agents: `POST /api/mcp` (JSON-RPC 2.0). Discovery is free; `tools/call` is paid.

REST exposes all four tools. MCP exposes `read_product` and `resolve_product` in v1;
`compare_products` and `brief_product` are REST-only for now (they compose `read_product`, so MCP
parity is a thin follow-up when an agent needs them).

## Tools

| Tool               | Status | Sync/async | Body                                                        |
| ------------------ | ------ | ---------- | ---------------------------------------------------------- |
| `read_product`     | live   | sync       | exactly one of `url`, `gtin`; optional `min_confidence`     |
| `resolve_product`  | live   | sync       | `name` (2+ chars); optional `min_confidence`                |
| `compare_products` | live   | sync       | `urls`: array of 2 to 5 product URLs                        |
| `brief_product`    | live   | sync       | exactly one of `url`, `gtin`, `name`                        |

`resolve_product` is synchronous in v1 (Exa neural search then extraction of the top candidates,
within the request budget). The original async design (return `id` + `pending`, deliver via webhook)
is deferred until latency or batch size demands it.

### Response envelope (read_product / resolve_product / brief_product)

```json
{
  "request_id": "...",
  "input": { "url": "..." },
  "product": { "title": "...", "brand": "...", "gtin": "...", "price": { "low": 110, "high": 110, "currency": "USD", "as_of": "...", "n_sources": 2 }, "availability": "in_stock", "attributes": {} },
  "field_confidence": { "title": 0.95, "price": 0.8 },
  "confidence": 0.77,
  "method": "shopify",
  "sources": ["..."],
  "cost_usd": 0.012,
  "cached": false,
  "as_of": "..."
}
```

`compare_products` returns `{ input, items[], price_delta, cost_usd, cached }`. `brief_product`
adds a `brief` string composed deterministically from the typed fields (no LLM, no invention).

## Auth

Two independent paths. A `tools/call` (or any REST tool) needs one of them.

### API key (`plk_`)

- Keys are sha256-hashed at rest; the prefix and last four are stored for display. The full key is
  shown once at creation.
- One key per account in v1. Rotation is create-new then revoke-old from the dashboard.
- Keyed calls are rate-limited and metered (see below).
- Admin server functions require `requireSupabaseAuth` AND `has_role(auth.uid(), 'admin')`.

### x402 (agent micropayment)

- MCP `initialize`, `tools/list`, `ping` are free. `tools/call` with no key returns **HTTP 402**
  with a body: `{ x402Version: 1, error, accepts: [PaymentRequirements] }`.
- `PaymentRequirements`: `scheme: "exact"`, `network: "base-sepolia"`, `maxAmountRequired` (atomic
  USDC, 6 decimals), `payTo` (`X402_RECIPIENT`), `asset` (Base Sepolia USDC
  `0x036CbD53842c5426634e7929541eC2318f3dCF7e`), `maxTimeoutSeconds`, `extra: { name: "USDC", version: "2" }`.
- The agent signs an ERC-3009 `TransferWithAuthorization` (gasless for the buyer) and resends with a
  base64 `X-PAYMENT` header. Plinth verifies and settles via the facilitator
  (`X402_FACILITATOR`, default `https://x402.org/facilitator`), then returns `200` with an
  `X-PAYMENT-RESPONSE` header carrying the settlement (incl. tx hash).
- x402 calls are paid on-chain, so they skip account metering and rate limiting.
- Network is Base Sepolia in beta; mainnet at GA. We do not custody funds; payment goes straight to
  `X402_RECIPIENT`.

## Rate limits

- Per-plan, enforced by the `rate_check(_user_id)` Postgres function: a 60-second sliding window
  count over `usage_events`, budget = `plans.rate_per_sec * 60` per minute (default 60/min for an
  account with no active subscription).
- Every keyed response carries `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`.
  Over the limit returns `429` with `retry-after`.
- Fail-open: a rate-infra error never blocks a paying call.

## Metering

- Every keyed call writes a `usage_events` row (tool, endpoint, status, `cost_usd`, latency, cached)
  and touches `api_keys.last_used_at`. Writes are awaited (serverless drops fire-and-forget work).
- `usage_current_period()` aggregates the caller's current-period usage; it derives the user from
  `auth.uid()`, never from an argument.

## Webhooks

Deferred by design. The v1 tools are synchronous, so there is no async `resolution.done` event to
deliver. The `webhooks` and `webhook_deliveries` tables exist for when async resolve, batch jobs, or
billing-event fan-out land. The planned contract: HMAC-SHA256 of the raw body in `x-plinth-signature`,
retries at 30s / 2m / 10m / 1h / 6h / 24h, idempotency on `event.id`.

## Errors

JSON error bodies with a stable shape: `{ error, message }`. Common codes: `unauthorized` (401),
`rate_limited` (429), `invalid_request` / wrong-arity (422), `invalid_json` (400),
`external_worker_not_configured` (503), `payment_required` (402, x402). New codes are additive.

## Why these decisions

- **Confidence gate at 0.7 for cache:** below that the result is more noise than signal and would
  poison the next caller.
- **Price as a band:** product-page prices are stale, regional, or promotional. A band with `as_of`
  and `n_sources` is the smallest honest answer.
- **No bulk endpoints in v1:** they hide cost from agents and reward scraping we do not want.
- **Free MCP discovery, paid call:** an agent must be able to see the tools before it decides to pay.

---
Last reviewed: 2026-06-21.
