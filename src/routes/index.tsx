import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { API_BASE, MCP_URL, DEMO_GTIN } from "@/config/product";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plinth · Product data for agents" },
      {
        name: "description",
        content:
          "Typed product object from a URL, a barcode, or a fuzzy name. Confidence per field, cost stamped in the response, payable by an agent over MCP and x402.",
      },
      { property: "og:title", content: "Plinth · Product data for agents" },
      {
        property: "og:description",
        content:
          "Agents can decide what to buy. Reading the product page is where they still break. Plinth reads it for them.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

type Line = { text: string; cls?: string; delay: number };

// PLAN F0.8: the hero streams a REAL captured response, verbatim from the live
// extraction worker (src/data/hero-capture.json). Never hand-write response values here.
import heroCapture from "@/data/hero-capture.json";

const heroEnv = heroCapture.envelope;
const heroP = heroEnv.product;
const heroFC = heroEnv.field_confidence as Record<string, number>;

const RESPONSE_LINES: Line[] = [
  { text: "{", delay: 0 },
  { text: `  "product": {`, delay: 90 },
  { text: `    "title":  "${heroP.title}",`, delay: 70 },
  { text: `    "brand":  "${heroP.brand}",`, delay: 60 },
  { text: `    "sku":    "${heroP.sku}",`, delay: 60 },
  { text: `    "price":  { "low": ${heroP.price.low}, "high": ${heroP.price.high}, "currency": "${heroP.price.currency}", "n_sources": ${heroP.price.n_sources} },`, delay: 70 },
  { text: `    "availability": "${heroP.availability}"`, delay: 60 },
  { text: "  },", delay: 50 },
  { text: '  "field_confidence": {', delay: 90 },
  { text: `    "title": ${heroFC.title},  "brand": ${heroFC.brand},`, delay: 60 },
  { text: `    "sku":   ${heroFC.sku},   "priceLow": ${heroFC.priceLow}`, delay: 60 },
  { text: "  },", delay: 50 },
  { text: `  "method":    "${heroEnv.method}",`, delay: 80 },
  { text: `  "plinth_id": "${heroEnv.plinth_id}",`, delay: 60 },
  { text: `  "confidence": ${heroEnv.confidence},`, cls: "text-signal", delay: 180 },
  { text: `  "cost_usd":   ${heroEnv.cost_usd}`, cls: "text-signal", delay: 180 },
  { text: "}", delay: 80 },
];

const TOOLS = [
  { name: "read_product", desc: "One reference (URL/GTIN) → typed product object.", live: true },
  { name: "resolve_product", desc: "Fuzzy string → canonical identifiers.", live: true },
  { name: "compare_products", desc: "N references → matrix of deltas.", live: true },
  { name: "brief_product", desc: "Object + short read for the agent.", live: true },
];

function useStream(lines: Line[]) {
  const [shown, setShown] = useState(0);
  const cumulative = useMemo(() => {
    const out: number[] = [];
    let t = 400;
    for (const l of lines) { t += l.delay; out.push(t); }
    return out;
  }, [lines]);
  useEffect(() => {
    const timers = cumulative.map((t, i) => setTimeout(() => setShown((s) => Math.max(s, i + 1)), t));
    return () => timers.forEach(clearTimeout);
  }, [cumulative]);
  return shown;
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("waitlist").insert({
      email, company: company || null, use_case: useCase || null, source: "landing",
    });
    setSubmitting(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-md border border-hairline bg-surface p-6">
        <div className="font-display text-2xl text-foreground">You're in.</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the magic link to create a key and make your first call. It is free to start.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <Input required type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-surface" />
      <Input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-surface" />
      <Button type="submit" disabled={submitting} className="bg-signal text-background hover:opacity-90">
        {submitting ? "…" : "Request access"}
      </Button>
      <Input placeholder="What are you building? (optional)" value={useCase} onChange={(e) => setUseCase(e.target.value)} className="bg-surface sm:col-span-3" />
    </form>
  );
}

function Index() {
  const shown = useStream(RESPONSE_LINES);
  const done = shown >= RESPONSE_LINES.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:py-28">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
              Product data for agents
            </p>
            <h1 className="font-display mt-6 text-5xl leading-[1.05] text-balance text-foreground sm:text-6xl lg:text-[4.25rem]">
              Agents can decide what to buy.
              <span className="block italic text-stone mt-3 text-balance max-w-[22ch]">Reading the product page is where they still break.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Plinth reads it for them. One call turns a URL, a barcode, or a fuzzy
              name into a typed product object. Confidence per field, cost stamped
              in the response, payable by an agent.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3 font-mono text-sm">
              <a href="#waitlist" className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-2.5 font-medium text-background hover:opacity-90">
                Request access <span aria-hidden>→</span>
              </a>
              <a href="/docs" className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-foreground hover:border-foreground">
                Read the docs
              </a>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-hairline pt-6 font-mono text-xs">
              <div><dt className="text-muted-foreground">p50 cached</dt><dd className="mt-1 text-foreground">~80ms</dd></div>
              <div><dt className="text-muted-foreground">per call</dt><dd className="mt-1 text-foreground">from $0.01</dd></div>
              <div><dt className="text-muted-foreground">payment</dt><dd className="mt-1 text-foreground">key · x402</dd></div>
            </dl>
          </div>

          <div className="lg:pl-4">
            <div className="overflow-hidden rounded-md border border-hairline bg-surface shadow-[0_30px_60px_-30px_rgba(14,27,44,0.25)]">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-signal/15 px-1.5 py-0.5 text-signal">POST</span>
                  <span className="text-muted-foreground">/api/v1/</span>
                  <span className="text-foreground">read_product</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className={`dot ${done ? "" : "animate-pulse"}`} />
                  <span>{done ? "200 OK" : "streaming"}</span>
                </div>
              </div>
              <div className="border-b border-hairline px-4 py-3 font-mono text-xs leading-relaxed">
                <span className="text-muted-foreground">{"{ "}</span>
                <span className="text-foreground">"url"</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-signal break-all">"{heroCapture._meta.input.url}"</span>
                <span className="text-muted-foreground">{" }"}</span>
              </div>
              <div className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>response</span><span>application/json</span>
                </div>
                <pre className="min-h-[440px] overflow-x-auto font-mono text-[12.5px] leading-[1.7] text-foreground">
                  {RESPONSE_LINES.slice(0, shown).map((l, i) => {
                    const isLast = i === shown - 1 && !done;
                    return (
                      <div key={i} className={`stream-line ${l.cls ?? ""} ${isLast ? "caret" : ""}`}>
                        {l.text || "\u00A0"}
                      </div>
                    );
                  })}
                  {shown === 0 && <div className="caret">&nbsp;</div>}
                </pre>
              </div>
              <div className="border-t border-hairline px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                A real response, captured live from the product URL above. Confidence and cost stamped in.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THESIS */}
      <section id="thesis" className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-24 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">§00 · thesis</p>
            <h2 className="font-display mt-3 text-4xl text-foreground">Who it's for.</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <div className="font-display text-2xl text-foreground">Devs</div>
              <p className="mt-3 text-muted-foreground">
                You're writing the buy-flow for an agent. You don't want to maintain a
                JSON-LD parser, a headless Chrome fleet, a barcode lookup, and a price
                cache. You want one call that returns the same shape every time.
              </p>
            </div>
            <div>
              <div className="font-display text-2xl text-foreground">Agents</div>
              <p className="mt-3 text-muted-foreground">
                Discover the MCP server, call <span className="font-mono text-signal">read_product</span>,
                pay per call in USDC over x402. No account. No key rotation. The cost is
                in the response so you can decide whether to keep going.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" className="border-b border-hairline bg-surface/40">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-24 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">§01 · tools</p>
            <h2 className="font-display mt-3 text-4xl text-foreground">Four questions an agent actually asks.</h2>
            <p className="mt-4 text-sm text-muted-foreground">Not endpoints. The shape of the call matches the shape of the problem.</p>
          </div>
          <div className="divide-y divide-hairline border-y border-hairline">
            {TOOLS.map((t) => (
              <div key={t.name} className="grid grid-cols-[1fr_auto] items-center gap-6 py-5 font-mono text-sm">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-foreground">{t.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{t.desc}</span>
                </div>
                <span className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-widest ${t.live ? "border-signal/50 text-signal" : "border-hairline text-muted-foreground"}`}>
                  {t.live ? "shipping" : "soon"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-24 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">§02 · vs the field</p>
            <h2 className="font-display mt-3 text-4xl text-balance text-foreground">No one else ships this shape.</h2>
            <p className="mt-4 text-sm text-muted-foreground">Diffbot has the data. Firecrawl has the render. Neither was built for an agent to call and pay on its own.</p>
          </div>
          <div className="overflow-x-auto rounded-md border border-hairline">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-surface text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Capability</th>
                  <th className="px-4 py-3 text-signal">Plinth</th>
                  <th className="px-4 py-3">Diffbot</th>
                  <th className="px-4 py-3">Zyte</th>
                  <th className="px-4 py-3">Firecrawl + LLM</th>
                  <th className="px-4 py-3">DIY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline font-mono text-xs">
                {[
                  ["Typed product object",        "yes",   "yes",   "yes",   "you write the schema", "you write the schema"],
                  ["Confidence per field",        "yes",   "no",    "no",    "no",                    "you score it"],
                  ["Cost stamped in response",    "yes",   "no",    "no",    "no",                    "best guess"],
                  ["MCP server",                  "yes",   "no",    "no",    "no",                    "you build it"],
                  ["x402 micropayments",          "yes",   "no",    "no",    "no",                    "no"],
                  ["Fuzzy name resolve",          "yes",   "partial","partial","you glue it",         "you glue it"],
                  ["Price as a band + as_of",     "yes",   "single",  "single",  "single",            "single"],
                ].map(([k, p, d, z, f, diy]) => (
                  <tr key={k} className="bg-background">
                    <td className="px-4 py-3 text-foreground">{k}</td>
                    <td className="px-4 py-3 text-signal">{p}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d}</td>
                    <td className="px-4 py-3 text-muted-foreground">{z}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f}</td>
                    <td className="px-4 py-3 text-muted-foreground">{diy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-b border-hairline bg-surface/40">
        <div className="mx-auto max-w-[1280px] px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">§03 · pricing</p>
            <h2 className="font-display mt-3 text-5xl text-foreground">Per call. No seats.</h2>
            <p className="mt-4 text-muted-foreground">
              Devs pay with a key, metered through Stripe. Agents pay with USDC on Base via x402.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { name: "Free", price: "$0", desc: "1,000 trusted reads/mo · no card", feats: ["Single secret API key","REST + MCP","Email support"] },
              { name: "Starter", price: "$29", desc: "5,000 trusted reads · $0.01 overage", feats: ["Higher rate limits","All confidence levels","Priority email"], featured: true },
              { name: "Growth", price: "$199", desc: "50,000 trusted reads · $0.005 overage", feats: ["Highest rate limits","Slack channel","SLA"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-md border p-7 ${p.featured ? "border-signal bg-background" : "border-hairline bg-background"}`}>
                <div className="flex items-baseline justify-between">
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{p.name}</div>
                  {p.featured && <div className="font-mono text-[10px] uppercase tracking-widest text-signal">recommended</div>}
                </div>
                <div className="font-display text-5xl text-foreground mt-3">{p.price}<span className="text-base text-muted-foreground">/mo</span></div>
                <div className="mt-2 text-sm text-muted-foreground">{p.desc}</div>
                <ul className="mt-6 space-y-2 text-sm text-foreground">
                  {p.feats.map((f) => (<li key={f} className="flex gap-2"><span className="text-signal">→</span>{f}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SURFACES */}
      <section id="mcp" className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-24 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">§04 · surfaces</p>
            <h2 className="font-display mt-3 text-4xl text-foreground">REST for you. MCP for them.</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Same core, two surfaces. Devs hold a key. Agents discover the server and pay per call.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-md border border-hairline bg-surface p-6">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span className="dot" /> dev · REST
              </div>
              <pre className="mt-5 overflow-x-auto font-mono text-xs leading-relaxed text-foreground">
{`curl -X POST ${API_BASE}/read_product \\
  -H "authorization: Bearer plk_…" \\
  -d '{ "gtin": "${DEMO_GTIN}" }'`}
              </pre>
            </div>
            <div className="rounded-md border border-hairline bg-surface p-6">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span className="dot" style={{ background: "var(--verified)" }} /> agent · MCP + x402
              </div>
              <pre className="mt-5 overflow-x-auto font-mono text-xs leading-relaxed text-foreground">
{`${MCP_URL}
  tool: read_product
  pay:  USDC on Base Sepolia
  → { …object, cost_usd: 0.008 }`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-hairline bg-surface/40">
        <div className="mx-auto max-w-[1280px] px-6 py-24 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">§05 · FAQ</p>
            <h2 className="font-display mt-3 text-4xl text-foreground">Quick answers.</h2>
          </div>
          <div className="divide-y divide-hairline border-y border-hairline">
            {[
              ["Where does the data come from?", "JSON-LD and OpenGraph first, headless render fallback, barcode databases for GTIN. The source method is on every response."],
              ["Why a confidence score?", "Because product pages lie. We tell you how sure we are per field and overall. You decide the threshold."],
              ["Is price live?", "Price is a band with an as_of timestamp and a source count. We do not present a single live number as truth."],
              ["What's x402?", "An open micropayment standard. Agents pay per call in USDC on Base. No signup, no key rotation."],
              ["Why not Diffbot?", "Diffbot returns a typed object. It does not score confidence per field, does not stamp cost in the response, and has no MCP server or x402 surface. An agent cannot discover it and pay on its own."],
              ["Why not roll your own with Firecrawl + GPT?", "You can. You also own the schema, the cache policy, the confidence rubric, the price-band semantics, the barcode merge, the MCP server, and the x402 settlement. Plinth is that work, finished, behind one call."],
              ["Can a site request takedown?", <>Yes. <a href="/takedown" className="text-signal underline">File here</a>. We honor it within 24h.</>],
            ].map(([q, a], i) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="font-display text-xl text-foreground">{q}</span>
                  <span className="font-mono text-signal group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="border-b border-hairline">
        <div className="mx-auto max-w-[820px] px-6 py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Early access</p>
          <h2 className="font-display mt-4 text-5xl text-foreground">Start building.</h2>
          <p className="mt-4 text-muted-foreground">
            Sign in with a magic link, create a key, and make your first call. Free to start, no card required.
          </p>
          <div className="mt-10 text-left"><WaitlistForm /></div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
