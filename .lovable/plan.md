## 1. Brand: wire the logo everywhere

- Save the uploaded mark via Lovable assets CLI from `/mnt/user-uploads/plinth_1.png` → `src/assets/plinth-logo.png.asset.json`.
- Generate with imagegen, matched to the supplied wordmark (navy script, terracotta offset edge, cream background):
  - `public/favicon.png` (512×512, "p." mark, safe padding)
  - `public/og-image.png` (1200×630, full "plinth." wordmark centered, cream bg)
- Replace the default Lovable favicon in `public/`.
- In `src/routes/__root.tsx` head, add full icon set: `icon` 32px, `apple-touch-icon` 180px, `og:image`, `twitter:image`.
- In `SiteHeader.tsx`, replace the dot + Instrument Serif "plinth" text with `<img>` of the wordmark (height ~24px, `alt="plinth"`); keep the tagline subline.

## 2. Copy: fix wrapping and strip em dashes

- Remove the hardcoded `<br/>` in the hero H1; replace with `text-balance max-w-[14ch]` so it flows. Apply `text-balance` to all H1/H2.
- Ripgrep `rg "—" src/` and rewrite to period / comma / colon / parens. Title separator becomes `·` (middle dot), not em dash. Skip dashes inside JSON examples in the streaming hero.
- Sweep `src/routes/index.tsx`, `__root.tsx` meta, all `docs.*`, `terms.tsx`, `privacy.tsx`, `takedown.tsx`, `SiteFooter.tsx`, `WaitlistForm`, comparison table, pricing cards.

## 3. Public product documentation (`/docs/*`)

Audit existing docs routes (`index`, `quickstart`, `mcp`, `api.read-product`, `api.resolve-product`, `errors`) and fill any stubs with real content: full schema.org superset response, confidence rubric, cost model, cache semantics (7d/1h, ≥0.7 threshold), x402 flow on Base Sepolia, error code table. Add two new pages and link from `docs.tsx` sidebar: `docs/webhooks` (events, HMAC verification, retries) and `docs/rate-limits` (per-plan limits, 429 headers).

## 4. Competitive differentiation review and copy rewrite

Survey real comparators: Diffbot Product API, Zyte auto-extract, Bright Data Product Discovery, ScrapingBee/ScraperAPI, Apify product actors, Firecrawl + LLM extract, Crawlbase, Browse.ai, SerpAPI Shopping, Rye, PriceAPI, Crossmint x402 demos. For each, note: surface, pricing shape, typed object, confidence, cost-per-call exposure, MCP support, x402 support.

Likely real wedges to validate then sharpen:
1. MCP-native + x402 micropayments (none of Diffbot/Zyte/Bright Data ship this).
2. Cost stamped in every response (competitors charge credits opaquely).
3. Per-field confidence + overall score with cache gated at ≥0.7.
4. Price as a band with `as_of` + `n_sources`, not a fake-live single number.
5. One typed schema across URL, GTIN, and fuzzy name; most stacks compose 2-3 vendors.

Copy changes:
- Hero subhead gains a one-line wedge: "Typed object, confidence per field, cost in the response, payable by an agent."
- §00 thesis leads with the wedge sentence, then audience split.
- Each tool row gains a one-line "what makes ours different" stub.
- Replace the generic "DIY stack" comparison with a named-competitor matrix (rows: Plinth, Diffbot, Zyte, Firecrawl + LLM, DIY). Columns: typed object, confidence, cost in response, MCP, x402, fuzzy resolve, price band semantics.
- Add two FAQ entries: "Why not Diffbot?" / "Why not roll your own with Firecrawl + GPT?" — direct, factual.

## 5. Internal project documentation (`/docs-internal/`, role-scoped markdown)

Create a top-level `docs-internal/` directory in the repo with one markdown file per role. Each file is self-contained, links to the others, and is written for an AI agent picking up the project cold. Maintain a single index that any future agent reads first.

Files:

- `docs-internal/README.md` — entry point. Project one-liner, links to every role doc, "you are role X → read this file" routing table, glossary, links to the public `/docs` routes, link to `mem://index.md`.
- `docs-internal/product.md` — vision, the five wedges from §4, target users (devs + agents), JTBD, non-goals, roadmap themes (v1 shipped vs deferred), success metrics (activation: time-to-first-200, retention: weekly resolves/account, monetization: paid conversion, agent share via x402).
- `docs-internal/engineering.md` — stack (TanStack Start, Lovable Cloud, Vite, Tailwind v4), repo layout, route conventions, server-function rules, where the worker lives (external), data model summary with link to `supabase/migrations/`, env vars, local dev, deploy.
- `docs-internal/data-model.md` — every table (profiles, user_roles, api_keys, waitlist, plans, subscriptions, usage_events, product_cache, resolutions, webhooks, invoices), columns, RLS policy summary, retention, the schema.org superset for `product_cache`.
- `docs-internal/api.md` — REST + MCP surface, auth (`plk_` keys), x402 on Base Sepolia, rate limits, webhook events + HMAC, error codes. Mirrors `/docs` but with internal context (why decisions, what was rejected).
- `docs-internal/design.md` — Editorial Warm direction, color tokens, type pairing (Instrument Serif + Inter + JetBrains Mono), spacing, voice (no em dashes — period), examples of on-brand vs off-brand copy, logo usage.
- `docs-internal/sales.md` — ICP (agent builders, commerce infra teams, comparison/affiliate sites), qualifying questions, top-3 objections + responses, pricing tiers + when to quote custom, named-competitor talk track, demo script (curl → MCP → x402).
- `docs-internal/marketing.md` — positioning statement, messaging hierarchy (wedge → proof → social), channel plan (HN, X dev, MCP directories, Base ecosystem), launch checklist, content calendar themes, SEO keyword set (product data API, MCP product, x402 commerce, agent shopping), do-not-say list.
- `docs-internal/ops.md` — incident runbook (worker down, cache poisoned, takedown received, key compromise), on-call rotation placeholder, status page, log/metric locations (PostHog events, Supabase logs), backup/restore, secret rotation procedure.
- `docs-internal/support.md` — common tickets (key lost, overage charge, webhook not firing, low confidence), canned responses, escalation matrix, refund policy stub.
- `docs-internal/legal-trust.md` — TOS/Privacy/Takedown stubs and their status, DMCA process, PII policy (we don't store buyer PII; URL + GTIN cache only), confidence + price-band disclaimers, x402 wallet custody position (we hold no funds).
- `docs-internal/finance-billing.md` — Stripe plan SKUs, overage formula, x402 settlement flow, invoice generation, revenue recognition position, COGS notes (per-call extraction cost vs price).
- `docs-internal/security.md` — auth model, RLS posture, secrets handling, dependency policy, abuse handling (rate limits, IP bans), link to security memory doc.
- `docs-internal/contributing.md` — branching, commit style, when to use plan vs build mode, where to put new server fns, "before you ship" checklist.
- `docs-internal/glossary.md` — confidence, resolve vs read, GTIN, MCP, x402, plk_ key, schema.org superset, band price.

Each file ends with a "Last reviewed" date and a "If this is wrong, update both this file and `mem://index.md`" footer.

## 6. Verify

- `browser--view_preview` at 1280 and 390 → logo renders, hero wraps cleanly, no `—` visible in scanned copy.
- Crop hero with `image_tools--zoom_image` and compare to the user's screenshot.
- Open each `/docs` route and each `docs-internal/*.md` to confirm content, not placeholders.
- `rg "—" src/ docs-internal/` returns nothing outside JSON code blocks.

## Technical details

- Favicon link set in `__root.tsx`:
  ```tsx
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon.png" },
  { property: "og:image", content: "/og-image.png" },
  { name: "twitter:image", content: "/og-image.png" },
  ```
- Logo `<img>` via asset pointer: `import logo from "@/assets/plinth-logo.png.asset.json"` → `<img src={logo.url} alt="plinth" />`.
- Title separator: `·` middle dot.
- Hero H1: drop `<br/>`, add `text-balance max-w-[14ch]`; italic sub-line gets its own block with `text-balance max-w-[22ch]`.
- Competitor matrix: replace existing `<table>` rows in §02, keep styling.
- `docs-internal/` lives at the repo root (not under `src/`), is plain markdown, and is referenced from `mem://index.md` so future agents discover it.

## Out of scope

- Backend feature work (API keys UI, billing, admin, MCP server logic) — already queued in the next build batch.
- Custom OG illustration beyond the wordmark.

## Answers to your questions

- **Docs**: public `/docs` exists in skeleton; §3 fills gaps and adds 2 pages. Internal role-scoped docs do not yet exist; §5 creates the full set.
- **Differentiation**: the *product* is differentiated (MCP + x402 + cost-in-response + confidence-gated cache + price-as-band; no competitor ships all five). The *page copy* under-sells it today — §4 fixes that with a named-competitor matrix and a sharper hero wedge.
