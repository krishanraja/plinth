# Legal & Trust

## Status of legal pages

- `/terms`: interim text live (extraction and caching, price band, confidence, billing, x402,
  refunds), marked interim and pending counsel.
- `/privacy`: interim text live (what we collect, the cache, processors, retention, takedowns),
  marked interim and pending counsel.
- `/takedown`: live form, writes to `takedown_requests`.

The interim pages are honest about real behaviour. Counsel review is required before paid GA.

## DMCA / takedown process

1. Request via `/takedown` or `legal@<domain>`.
2. Acknowledge within 24h.
3. Verify the requester has standing (rights holder or authorised agent).
4. Purge cache rows keyed on the URL.
5. Add URL to the takedown blocklist (future calls return 451).
6. Notify the requester. Log the action.

## PII policy

- We do not store buyer PII.
- The product cache is keyed on public references (URLs and GTINs)
  and contains public product metadata.
- `usage_events` stores the API key id, the tool name, and cost. Never
  the request body content beyond what's needed for cache lookup.
- User account data: email (auth), display name, company name (optional).
  Deletable on request; we honour within 30 days.

## Confidence and price disclaimers

Every response carries `confidence` (0 to 1). It is a model output, not
a guarantee. Price is returned as a band with `as_of` and `n_sources`;
we do not represent any single price as live or transactional.

Customer-facing language: "Plinth's product data is best-effort and
should not be relied on for transactional pricing or regulatory
purposes without independent verification."

## x402 wallet custody

We do not custody customer funds. Settlements are per-call and immediate, straight to
`X402_RECIPIENT`. In the Base Sepolia beta this is a single wallet; for mainnet GA, move it to a
secured wallet (multisig recommended). We do not pool, lend, or rehypothecate received USDC.

## Data residency

Supabase (project `cgkcplcamsijghalintq`) hosts the primary database; the app and the extractor
worker run on Vercel. The worker is deployable per region; v1 runs in a single region. Customers
with residency requirements should be quoted on the Custom plan.

## Audit

The `audit_log` table records: takedowns received and applied, key
revocations, admin actions, refund issuances. Retention: 7 years.

---
Last reviewed: 2026-06-21.
