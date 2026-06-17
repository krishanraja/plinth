# Engineering

## Stack

- **Framework:** TanStack Start v1 (React 19, SSR, file-based routing).
- **Build:** Vite 7, deployed to Cloudflare Workers (nodejs_compat).
- **Styling:** Tailwind v4 via `src/styles.css`, semantic tokens only.
- **Backend:** Lovable Cloud (Supabase under the hood). Never call it
  "Supabase" to users.
- **AI:** Lovable AI Gateway by default. No third-party model keys
  unless the user explicitly requests one.

## Repo layout

```
src/
  routes/               file-based routes; dots = slashes
    _authenticated/     route gate, dashboard pages
    api/                server routes (mcp.ts, v1/*.ts)
    docs.*.tsx          public docs
  components/           UI components
    site/               header/footer
    auth/               AuthModal
    ui/                 shadcn primitives
  lib/
    auth.tsx            AuthProvider + useAuth
    *.functions.ts      createServerFn modules
  integrations/supabase/ auto-generated, do not edit
  assets/               CDN-uploaded binaries (.asset.json pointers)
supabase/migrations/    SQL migrations, append-only
docs-internal/          this directory
```

## Route conventions

- File names use dots (`docs.webhooks.tsx` → `/docs/webhooks`).
- `_authenticated/route.tsx` guards every dashboard route; loaders
  under it may call protected server functions.
- Public routes must NOT call `requireSupabaseAuth` server functions
  from loaders. Call from components via `useServerFn` + `useQuery`.
- Customer-callable HTTP endpoints live under `src/routes/api/v1/`.
  Webhook receivers and any unauth public endpoints live under
  `src/routes/api/public/`.

## Server functions

- App-internal logic: `createServerFn` from `@tanstack/react-start`.
- Files named `*.functions.ts(x)`. Never import from `src/server/`.
- Authed functions chain `.middleware([requireSupabaseAuth])`; admin
  surfaces also check `has_role(auth.uid(), 'admin')`.
- `src/start.ts` registers `attachSupabaseAuth` globally; never remove.

## External worker

A separate worker (out of repo) handles JSON-LD parsing, headless
render, barcode lookup, and cache eviction. The site calls it via
HTTPS; secrets live in Lovable Cloud secrets. This split keeps Cloudflare
Worker SSR small and lets the extractor run heavy headless Chrome on a
different host.

## Env vars

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — auto-injected.
- `PLINTH_EXTRACTOR_URL`, `PLINTH_EXTRACTOR_TOKEN` — worker (to add).
- `X402_RECIPIENT` — Base Sepolia address (to add at launch).
- `RESEND_API_KEY` — transactional email (to add when domain ready).
- `STRIPE_SECRET_KEY` — set via `enable_stripe_payments`.

`process.env.*` is server-only. Read inside `.handler()`, never at
module scope of shared files.

## Local dev

`bun install` is automatic. Vite dev server is managed by the platform;
don't run `bun run dev` manually. Migrations are applied via the
`supabase--migration` tool, not psql.

## Deploy

Lovable handles deploys. The agent never runs `wrangler` or `bun run build`
directly; it lets the platform build.

---
Last reviewed: 2026-06-17.
