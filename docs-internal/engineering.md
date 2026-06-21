# Engineering

## Stack

- **Framework:** TanStack Start (React 19, SSR, file-based routing) on Vite, built with Nitro.
- **Hosting:** Vercel (Node / Fluid Compute functions, not edge). `main` auto-deploys; PRs get
  preview deploys. `src/server.ts` is the Nitro entry.
- **Styling:** Tailwind v4 via `src/styles.css`, semantic tokens only (Editorial Warm).
- **Backend:** Supabase, project `cgkcplcamsijghalintq` (own project; Lovable has been ejected).
  Postgres 17, RLS on every table, PostgREST, Auth, `pg_cron` for cache purge.
- **Extraction:** a separate worker (see below). No model-gateway dependency in the core path;
  `resolve_product` uses Exa for retrieval.

## Repo layout

```
src/
  routes/
    _authenticated/     route gate, dashboard pages (keys, usage, billing, overview)
    api/
      v1/               REST tools: read_product, resolve_product, compare_products, brief_product
      mcp.ts            MCP JSON-RPC server (free discovery, paid tools/call)
      stripe/webhook.ts Stripe webhook (manual HMAC verify)
      health.ts         /api/health probe
    terms.tsx, privacy.tsx, docs.*.tsx   public pages
  components/           UI (site/, auth/, ui/ shadcn primitives)
  lib/
    auth.tsx            AuthProvider + useAuth
    api/                billing.functions.ts, x402.server.ts, keys.functions.ts
  integrations/supabase/  client(s), api-keys.server, rate-limit.server, generated types
supabase/migrations/    SQL, append-only
docs-internal/          this directory      docs/  public-facing decision records
```

## Route + server-function conventions

- File names use dots (`dashboard.billing.tsx` -> `/dashboard/billing`).
- `_authenticated/route.tsx` guards dashboard routes.
- Customer-callable HTTP endpoints are `createFileRoute(...).server.handlers`. Server-only modules
  (`*.server.ts`, anything importing `supabaseAdmin` or secrets) are dynamically imported inside the
  handler so they never reach the client bundle.
- App-internal mutations use `createServerFn` in `*.functions.ts`, chaining
  `.middleware([requireSupabaseAuth])`; admin surfaces also check `has_role(auth.uid(), 'admin')`.
- `src/start.ts` registers `attachSupabaseAuth` globally; do not remove.
- `routeTree.gen.ts` is generated at build. After adding a route, build before committing so the
  committed tree includes it (and tsc stays green).

## External worker

A separate deploy (`krishanraja/plinth-worker`, Vercel, Node) does the real work: JSON-LD,
OpenGraph, Shopify, barcode lookup, headless render (Browserless), confidence scoring, and the cache
read/write. The app proxies tool calls to it over HTTPS with `PLINTH_EXTRACTOR_TOKEN`. Keeping
extraction out of the SSR app keeps the app functions small and lets the worker run heavy work
elsewhere. The worker exposes `/extract` and `/health`.

## Env vars (app)

- `PLINTH_EXTRACTOR_URL`, `PLINTH_EXTRACTOR_TOKEN` -- the worker.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` -- billing.
- `X402_RECIPIENT` -- the Base Sepolia payee. `X402_FACILITATOR`, `X402_NETWORK`, `X402_ASSET`,
  `X402_PRICE_ATOMIC` are optional (sane Base Sepolia defaults live in `x402.server.ts`).
- `APP_BASE_URL` -- absolute base for Stripe redirect URLs (defaults to the Vercel URL; set to
  `https://onplinth.io` once DNS resolves).
- Supabase URL + publishable key (`VITE_*`) for the client; service role for server-only admin.

Worker env: `PLINTH_EXTRACTOR_TOKEN`, `EXA_API_KEY` (resolve), Browserless token, Supabase service
role. `process.env.*` is server-only: read it inside the handler, never at shared-module scope.

## Local dev and deploy

```bash
bun install
bunx tsc --noEmit
bun run build      # also regenerates routeTree.gen.ts
bun run lint
```

Ship: branch, PR, green CI (`.github/workflows/ci.yml`: install, em-dash grep on `src/`, tsc, build;
lint runs non-blocking pending a one-time prettier pass), squash-merge. Vercel deploys `main`
automatically. Migrations are applied to `cgkc` via the Supabase Management API / MCP and mirrored
into `supabase/migrations/`.

---
Last reviewed: 2026-06-21.
