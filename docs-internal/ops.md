# Ops

## Deploy

- The app is on **Vercel**. `main` auto-deploys; every PR gets a preview. CI
  (`.github/workflows/ci.yml`) runs install, em-dash grep, tsc, and build on each PR and on `main`.
- The **extraction worker** is a separate Vercel deploy.
- **Rollback:** promote the previous good deployment in the Vercel dashboard (or `vercel rollback`).
- **Migrations** apply to Supabase `cgkcplcamsijghalintq` via the Management API / MCP and are
  mirrored into `supabase/migrations/`.
- Quick read of system state: `GET /api/health` returns `{ status, checks: { worker, billing, x402 } }`.

## Runbooks

### Extractor worker down

Symptom: tools return `upstream_unavailable` / `external_worker_not_configured`, or `/api/health`
shows `worker: down`.

1. Hit the worker's `/health` directly; check Vercel function logs for the worker project.
2. Confirm `PLINTH_EXTRACTOR_URL` and `PLINTH_EXTRACTOR_TOKEN` are set on the app.
3. The app already serves from cache when possible and returns a clean error on a miss.
4. Note it on the status page when one exists.

### Cache poisoned

Symptom: a customer reports a wrong `brand` / `model` / `price`.

1. Find the `product_cache` row (key by URL or GTIN) via the Management API.
2. Delete the row. The next call re-extracts.
3. If the source page changed structurally, file a parser bug on the worker.
4. If poisoned by adversarial JSON-LD, force render-only for that host on the worker.

### Takedown received

1. Open the `takedown_requests` row.
2. Delete every `product_cache` row keyed on the URL.
3. Mark the source blocked so it is not re-cached.
4. Reply to the requester within 24h.
5. Log it in `audit_log`.

### API key compromised

1. Revoke the key from the dashboard / set `revoked_at`.
2. Audit `usage_events` for the key; flag anomalies.
3. Email the owner the rotation steps (create new, then revoke old).

### Stripe webhook gap

1. Compare the Stripe dashboard to the local `subscriptions` table.
2. Replay missing events from the Stripe dashboard, or resend to `/api/stripe/webhook`.
3. On signature failures, rotate `STRIPE_WEBHOOK_SECRET` and redeploy.

## On-call

v1 default: the founder is on call. `/api/health` plus Vercel and Supabase logs are the sources of
truth until a status page exists.

## Observability

- **Health:** `/api/health` (worker reachability, billing and x402 configured).
- **Vercel:** function logs and build logs for the app and the worker.
- **Supabase:** Postgres, PostgREST, and auth logs; `audit_log` table for sensitive actions.
- Product analytics (PostHog or similar) is not wired yet; add it before paid GA if needed.

## Backups

Supabase manages Postgres backups. The `product_cache` is rebuildable from source and is not in the
disaster-recovery critical path. Do a restore drill before GA.

## Secret rotation

- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: rotate the webhook secret every 90 days; rotate the
  secret key if it was ever exposed (the beta keys were pasted in chat and should be rotated).
- `PLINTH_EXTRACTOR_TOKEN`: on suspected exposure.
- `X402_RECIPIENT`: only changes if the payee wallet changes.
- Customer API keys: customer-driven; admin can force-revoke.

---
Last reviewed: 2026-06-21.
