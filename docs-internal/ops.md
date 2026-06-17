# Ops

## Runbooks

### Extractor worker down

Symptom: `read_product` returns 500 with `extractor_unreachable`.

1. Check the worker's status page / logs.
2. Confirm `PLINTH_EXTRACTOR_URL` is reachable from a Cloudflare Worker
   probe.
3. Flip the kill switch in admin → serves cached only, 503 for misses.
4. Post to status page within 10 minutes.

### Cache poisoned

Symptom: customer reports wrong `brand`/`model`/`price`.

1. Find the cache row in admin (key by URL or GTIN).
2. Purge the row. Confirm `cache.invalidated` webhook fires.
3. If the source page has structural changes, file a parser bug.
4. If poisoned by adversarial JSON-LD, add the host to the
   render-only allowlist.

### Takedown received

1. Open the takedown ticket in admin.
2. Purge every cache row keyed on the URL.
3. Add the URL to the takedown blocklist (returns 451 on future calls).
4. Reply to the requester within 24h, confirm action taken.
5. Log the event in the audit table.

### API key compromised

1. Revoke the key in admin (sets `revoked_at`).
2. Refund any usage in the last 24h pending customer reply.
3. Audit `usage_events` for the key; flag anomalies.
4. Email the owner with the rotation steps.

### Stripe webhook gap

1. Compare Stripe dashboard to local `subscriptions`.
2. Replay missing events via Stripe CLI.
3. If signature failure, rotate the webhook secret and redeploy.

## On-call

To be filled when the team exists. v1 default: founder is on call,
status page is the single source of truth.

## Observability

- **PostHog:** product events (`call.read_product`,
  `call.resolve_product.pending`, `dashboard.key_created`,
  `waitlist.submitted`, `x402.paid`).
- **Lovable Cloud logs:** server function and migration logs.
- **Extractor:** logs and traces on the external worker.

## Backups

Lovable Cloud handles Postgres backups. Confirm a restore drill
quarterly. The product cache is rebuildable from source and is not in
the disaster-recovery critical path.

## Secret rotation

- Stripe webhook secret: every 90 days.
- `X402_RECIPIENT`: only on key compromise.
- `RESEND_API_KEY`: on team-member exit.
- API keys (customer): customer-driven; admin can force-revoke.

---
Last reviewed: 2026-06-17.
