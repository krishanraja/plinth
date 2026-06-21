# Security

## Auth model

- Email auth via Supabase Auth (project `cgkcplcamsijghalintq`).
- Sessions managed by Supabase; never persisted server-side.
- Customer API keys: `plk_` prefix + 32 random bytes. sha256-hashed at
  rest. Shown ONCE at creation. One key per account in v1.

## Roles

Two roles: `user`, `admin`. Stored in `user_roles` only. Checked via
`public.has_role(_user_id, _role)` security-definer function. NEVER
store role on `profiles`.

## RLS posture

- Every public-schema table has RLS enabled and explicit GRANTs.
- Owner-scoped tables: `using (auth.uid() = user_id)`.
- Admin-only reads: `using (public.has_role(auth.uid(), 'admin'))`.
- Service-role only tables (`product_cache`, raw extraction data):
  no GRANTs to `authenticated` or `anon`.

## Secrets handling

- Secrets are Vercel environment variables (app and worker projects). Ops copies live in the local
  gitignored vault (`.claude/secrets/plinth.env`); never inline a secret into a commit, PR, or
  synced doc.
- Read inside server-function handlers (or dynamically imported `*.server.ts`), never at module
  scope of client-imported files.
- The Supabase service-role key is never imported at the top level of a route file.
- Stripe webhook secret: rotate every 90 days. The beta Stripe keys were pasted in chat and should
  be rotated.

## Abuse handling

- Rate limits per key (see `/docs/rate-limits`).
- Soft IP bans on > 100 unauth 401s/hour.
- Takedown blocklist enforced at extraction time.
- Anti-scraping: no bulk endpoints, no result pagination in v1.

## Dependency policy

- The app runs on Vercel Node functions, so full Node is available. Still keep functions lean and
  prefer fetch over heavy SDKs (the Stripe and x402 integrations use plain `fetch`, not SDKs).
- `bun audit` before each release; high/critical patched the same week.
- Keep cold starts small: avoid pulling large native deps into the SSR path.

## Security memory

Live posture and ignored-finding rationale: see the project security
memory (managed via the security tool). Update both when posture
changes.

---
Last reviewed: 2026-06-21.
