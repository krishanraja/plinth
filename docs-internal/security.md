# Security

## Auth model

- Magic-link email auth (Lovable Cloud / Supabase Auth).
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

- All secrets stored via Lovable secrets manager.
- Read inside server-function handlers, never at module scope of
  client-imported files.
- Service-role key never imported in route files at the top level.
- Webhook secrets: rotate every 90 days.

## Abuse handling

- Rate limits per key (see `/docs/rate-limits`).
- Soft IP bans on > 100 unauth 401s/hour.
- Takedown blocklist enforced at extraction time.
- Anti-scraping: no bulk endpoints, no result pagination in v1.

## Dependency policy

- npm packages reviewed for Worker compatibility (no node-gyp, no
  child_process, no native bindings).
- `bun audit` run before each release; high/critical patched same week.
- Avoid packages that assume a long-lived Node process.

## Security memory

Live posture and ignored-finding rationale: see the project security
memory (managed via the security tool). Update both when posture
changes.

---
Last reviewed: 2026-06-17.
