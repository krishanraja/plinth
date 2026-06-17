# Data Model

Authoritative SQL lives in `supabase/migrations/`. This file summarises
the shape and the access rules. When a migration changes a table,
update this file in the same change.

## Tables

| Table                | Purpose                                                                   | RLS posture                                                                |
| -------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `profiles`           | Per-user profile (display name, company, created_at)                      | Owner read/write via `auth.uid() = id`                                     |
| `user_roles`         | App roles (`admin`, `user`)                                               | Read via `has_role()` security-definer fn only; never selected client-side directly |
| `waitlist`           | Pre-launch sign-ups                                                       | Insert open to anon; select admin-only                                     |
| `plans`              | Plan catalogue (Free / Starter / Growth)                                  | Public read                                                                |
| `subscriptions`      | Owner ↔ plan, status, Stripe ids                                          | Owner read; service_role writes                                            |
| `api_keys`           | Hashed key (sha256), prefix, label, last_used_at, revoked_at              | Owner read; insert/revoke via server fn                                    |
| `usage_events`       | Per-call: key_id, tool, cost_usd, cached, latency_ms, created_at          | Owner read; service_role inserts                                           |
| `product_cache`      | Schema.org Product superset, ttl, confidence, source_method               | Service-role only; never read directly from the client                     |
| `resolutions`        | Async `resolve_product` runs: status, result_id, confidence               | Owner read; service_role writes                                            |
| `webhooks`           | Endpoint, secret, events[], status                                        | Owner CRUD                                                                 |
| `webhook_deliveries` | Attempts, status code, response body excerpt                              | Owner read                                                                 |
| `invoices`           | Stripe invoice mirror for in-app history                                  | Owner read                                                                 |
| `takedown_requests`  | Email, url, reason, status                                                | Insert open; admin read/triage                                             |

## Roles

`app_role` enum: `admin`, `user`. Roles live in `user_roles`, NEVER on
`profiles`. The `public.has_role(_user_id, _role)` security-definer
function is the only legitimate way to check role membership. Use it
in RLS policies and admin gates.

## Retention

- `product_cache`: 7 days default TTL; 1 hour for high-volatility
  fields (price, availability). Manual purge via admin; automatic purge
  on takedown.
- `usage_events`: 90 days at minimum, longer for billing reconciliation.
- `webhook_deliveries`: 30 days.
- `waitlist`: kept until launch, then archived.

## Product cache shape (Schema.org Product superset)

```jsonc
{
  "@type": "Product",
  "canonical": { "gtin", "mpn", "brand", "model" },
  "title", "description", "category",
  "attributes": { /* normalised: storage_gb, color, screen_size_in, ... */ },
  "images": ["..."],
  "price": { "band": { "low", "high", "currency" }, "as_of", "n_sources" },
  "availability": "in_stock|out_of_stock|preorder|unknown",
  "reviews_summary": { "rating", "count" },
  "variants": [{ "title", "canonical", "attributes" }],
  "source": { "method": "jsonld|opengraph|render|barcode|cache", "urls": [] },
  "confidence": 0.0,
  "field_confidence": { "<field>": 0.0 }
}
```

The cache key is the normalised input (URL, GTIN, or canonical fuzzy
hash). Entries below 0.7 overall confidence are NOT written.

## PII

We do not store buyer PII. The cache keys on public references (URLs and
GTINs). `usage_events` stores the key id and tool, never the request
body beyond what is needed for the cache.

---
Last reviewed: 2026-06-17.
