# Marketing

## Positioning statement

For developers building agent buy-flows, Plinth is the product-data
primitive that returns a typed product object with confidence per field
and the per-call cost in the response, and that an autonomous agent can
discover and pay for over MCP and x402, without a human signup.

## Messaging hierarchy

1. **Wedge (one line):** "Typed product object. Confidence per field.
   Cost in the response. Payable by an agent."
2. **Proof:** the streaming hero response, the named-competitor matrix,
   the docs.
3. **Social:** waitlist count, agent ecosystem partners (when real),
   customer quotes (when real). Never fabricate.

Do not lead with "AI", "next-generation", or "intelligent".

## Channels (launch)

- **Hacker News:** Show HN at launch with a real `curl` demo.
- **X / dev Twitter:** focus on the agent + x402 angle. Cross-post to
  Base ecosystem accounts.
- **MCP directories:** list as soon as MCP route is live on mainnet.
- **Base ecosystem:** the x402 wedge is novel here; lean in.
- **Targeted DMs:** Diffbot / Firecrawl power users complaining about
  schema drift or pricing.
- **Long-form:** one post per wedge. "Why we price by the call."
  "Confidence is a feature, not a footnote." "Why a band beats a price."

## SEO

Primary keyword set:

- "product data API"
- "MCP product server"
- "x402 commerce API"
- "agent shopping API"
- "product confidence score"
- "schema.org product API"

Single H1 per page. Distinct meta description per route. Canonical and
og:url match the route, never the homepage.

## Launch checklist

- [ ] Custom domain wired (DNS, Resend, email).
- [ ] Owner email + support@ alias.
- [ ] x402 wallet (mainnet) set in `X402_RECIPIENT`.
- [ ] Stripe enabled; Free/Starter/Growth SKUs live.
- [ ] First 25 waitlist approvals batched and emailed.
- [ ] PostHog dashboards for activation, retention, cost-per-call.
- [ ] Status page live.
- [ ] HN post drafted, demo recorded.

## Do-not-say list

- "AI-powered"
- "Real-time" (we have caches and price bands; say so)
- "Enterprise-grade" (until we have one)
- "The Stripe of product data" (or any "the X of Y")
- Em dashes (see design.md)

---
Last reviewed: 2026-06-17.
