# Plinth: outstanding checklist

The build is complete and verified (all four tools, auth, metering, rate limiting, dashboard, MCP,
Stripe billing, x402 settlement, CI, health, interim legal, docs). What remains is a short list of
items that need a human action or an external clock. Last updated 2026-06-22.

## Founder actions (blocking GA)

- [ ] **Revoke the old Stripe secret key.** A new `sk_live` was rotated in and is wired (vault +
      Vercel env, redeployed, verified against the live Starter price). But the *previous*
      `sk_live` is **still active** in Stripe (creating a new key does not revoke the old one) and
      was exposed in chat. Delete it: Stripe Dashboard, Developers, API keys, delete the old secret
      key. Nothing in production uses it anymore.

- [ ] **Point `onplinth.io` at Vercel.** Vercel reports the domain as `misconfigured`: its
      nameservers are still Namecheap defaults (`dns1/dns2.registrar-servers.com`) and it resolves
      to a parking IP, so it does not serve from Vercel yet. Fix at Namecheap, either:
      - Nameservers: set Custom DNS to `ns1.vercel-dns.com` and `ns2.vercel-dns.com`; or
      - Records: `A` `@` to `76.76.21.21`, `CNAME` `www` to `cname.vercel-dns.com`.
      Once it resolves, the agent runs the repoint (set `APP_BASE_URL`, repoint the Stripe webhook
      URL, swap the hardcoded `plinth-tan` references, redeploy, verify). Everything on Vercel's
      side is already provisioned and verified.

- [ ] **Counsel review of the interim legal** (`/terms`, `/privacy`) before paid GA.

- [ ] **Flip to paid GA** when ready (the go-live decision).

## Founder actions (optional / verification)

- [ ] **Confirm subscription activation.** Checkout is verified to live Stripe, and the webhook
      verifies signatures and mirrors subscriptions. To confirm a real activation without a charge,
      provide an `sk_test_` key (the agent drives a test-card checkout) or do one refunded live
      charge.

- [ ] **x402 literal settled 200 (optional).** The full flow is proven (a real signed payment
      reaches the facilitator and returns `insufficient_balance`, i.e. only funds are missing). For
      an on-chain `200`, the agent generates a persistent buyer wallet, you drip it a little Base
      Sepolia USDC from a faucet, and the agent runs the buyer client once.

- [ ] **Delete scratch files** in `C:\Users\krish\plinth\` (the agent's `rm` is sandbox-blocked):
      `verify_dash.mjs`, `verify_billing.mjs`, `buyer_x402.mjs`, `.pw_session.json`, `.pw_dash.png`,
      `.pw_billing.png`, `node_modules/`, `package.json`, `package-lock.json`.

## Agent will do automatically when unblocked

- [ ] **Repoint to `onplinth.io`** the moment DNS resolves to Vercel (see above).
- [ ] **Update the Vercel env** if any further key rotations happen (paste the new key).

## Done and verified

Phases 0 to 4. Four tools live (REST; MCP for read + resolve), `plk_` key auth, usage metering,
per-plan rate limiting, the dashboard (keys, usage, billing, overview), Stripe billing (checkout +
portal + signature-verified webhook, browser-verified to live Stripe), x402 settlement on Base
Sepolia (verify and settle via facilitator, full flow proven), CI, `/api/health`, interim legal, and
the full doc set. See `KILL-CRITERIA.md` for the North Star, and the repo `_STATE.md` for the live
build ledger.
