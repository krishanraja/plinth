# API (internal reference)

Public docs live at `/docs/*`. This file is the why and the trade-offs.

## Surfaces

- **REST** for developers. Auth via `Authorization: Bearer plk_…`.
- **MCP** for agents. Discovery via standard MCP listing; x402 for
  payment. Same tools, same shapes.

We deliberately keep REST and MCP feature-identical. Anything you ship
to one, ship to the other in the same release.

## Tools (v1)

| Tool              | Status   | Sync/Async | Notes                                                  |
| ----------------- | -------- | ---------- | ------------------------------------------------------ |
| `read_product`    | stub     | sync       | Body must contain `url` or `gtin`. Never both. Returns 503 until the worker is wired (Phase 1). |
| `resolve_product` | stub     | async      | Returns `id` + `pending`. Result via poll or webhook. Returns 503 until the worker is wired (Phase 1). |
| `compare_products`| deferred | sync       | N references → matrix of deltas.                       |
| `brief_product`   | deferred | sync       | Product + 200-word agent-readable read.                |

## Auth

- Keys are sha256-hashed at rest. The prefix (`plk_xxxx`) is stored in
  plaintext for UI display. Full key shown ONCE at creation.
- One key per account at v1. Rotation is "create new + revoke old"
  with a 24h grace window.
- Admin endpoints require `requireSupabaseAuth` AND
  `has_role(auth.uid(), 'admin')`.

## x402

- Network: Base Sepolia in v1, mainnet on GA.
- Asset: USDC.
- Recipient: env `X402_RECIPIENT`. Stubbed until the wallet is set.
- Settlement is per-call. We do not custody funds; the recipient is our
  own multisig (see legal-trust.md).

## Rate limits

Documented at `/docs/rate-limits`. Cached reads cost 1/10 the weight of
live extractions. 429 responses include `retry-after`.

## Webhooks

- Events: see `/docs/webhooks`.
- Signature: HMAC-SHA256 of raw body, hex, header
  `x-plinth-signature`.
- Retries: 30s, 2m, 10m, 1h, 6h, 24h. Idempotency on `event.id`.

## Errors

Stable error codes documented at `/docs/errors`. New codes are additive;
we do not repurpose codes. Every error response carries `request_id`.

## Why these decisions

- **Async resolve_product:** fuzzy matching can take seconds; blocking
  the request would hurt agent throughput and make rate limits awkward.
- **Confidence gate at 0.7 for cache:** below that, the result is more
  noise than signal and pollutes the cache for the next caller.
- **Price as a band:** prices on product pages are stale, regional, or
  promotional. A single number is dishonest. A band with `as_of` and
  `n_sources` is the smallest honest answer.
- **No bulk endpoints in v1:** they hide cost from agents and reward
  scraping behaviour we don't want to encourage.

---
Last reviewed: 2026-06-17.
