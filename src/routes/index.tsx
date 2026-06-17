import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plinth — Product data for agents" },
      {
        name: "description",
        content:
          "One call. Clean object. Cost stamped. Plinth turns a URL, barcode, or fuzzy name into a typed product object for agents.",
      },
    ],
  }),
  component: Index,
});

type Line = { text: string; cls?: string; delay: number };

const RESPONSE_LINES: Line[] = [
  { text: "{", delay: 0 },
  { text: '  "canonical": {', delay: 120 },
  { text: '    "gtin":  "00194253433767",', delay: 80 },
  { text: '    "mpn":   "MX2Y3LL/A",', delay: 80 },
  { text: '    "brand": "Apple",', delay: 80 },
  { text: '    "model": "MacBook Pro 16-inch (M3 Pro, 2024)"', delay: 80 },
  { text: "  },", delay: 60 },
  { text: '  "title": "Apple MacBook Pro 16\\" M3 Pro 1TB Space Black",', delay: 100 },
  { text: '  "category": { "code": "ELEC.COMPUTERS.LAPTOPS" },', delay: 90 },
  { text: '  "attributes": {', delay: 90 },
  { text: '    "screen_size_in": 16.2,', delay: 60 },
  { text: '    "storage_gb":     1024,', delay: 60 },
  { text: '    "ram_gb":         18,', delay: 60 },
  { text: '    "color":          "Space Black"', delay: 60 },
  { text: "  },", delay: 60 },
  { text: '  "price": {', delay: 120 },
  { text: '    "band":      { "low": 2399.00, "high": 2699.00, "currency": "USD" },', delay: 80 },
  { text: '    "as_of":     "2026-06-17T14:00:00Z",', delay: 60 },
  { text: '    "n_sources": 3,', delay: 60 },
  { text: '    "confidence": 0.74', delay: 60 },
  { text: "  },", delay: 60 },
  { text: '  "source": { "method": "jsonld", "urls": ["apple.com/…"] },', delay: 120 },
  { text: '  "confidence": 0.81,', cls: "text-[color:var(--verified)]", delay: 220 },
  { text: '  "cost_usd":   0.012', cls: "text-signal", delay: 220 },
  { text: "}", delay: 100 },
];

const TOOLS = [
  { name: "read_product", desc: "One reference → typed product object.", live: true },
  { name: "resolve_product", desc: "Fuzzy string → canonical identifiers.", live: true },
  { name: "compare_products", desc: "N references → matrix of deltas.", live: false },
  { name: "brief_product", desc: "Object + short read for the agent.", live: false },
];

function useStream(lines: Line[]) {
  const [shown, setShown] = useState(0);
  const cumulative = useMemo(() => {
    const out: number[] = [];
    let t = 400;
    for (const l of lines) {
      t += l.delay;
      out.push(t);
    }
    return out;
  }, [lines]);

  useEffect(() => {
    const timers = cumulative.map((t, i) =>
      setTimeout(() => setShown((s) => Math.max(s, i + 1)), t),
    );
    return () => timers.forEach(clearTimeout);
  }, [cumulative]);

  return shown;
}

function Index() {
  const shown = useStream(RESPONSE_LINES);
  const done = shown >= RESPONSE_LINES.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="dot" aria-hidden />
            <span className="font-display text-base font-bold tracking-tight text-foreground">
              plinth
            </span>
            <span className="ml-3 text-muted-foreground">v0.1 · pre-release</span>
          </div>
          <nav className="hidden items-center gap-6 text-muted-foreground sm:flex">
            <a href="#tools" className="hover:text-foreground">tools</a>
            <a href="#schema" className="hover:text-foreground">schema</a>
            <a href="#pricing" className="hover:text-foreground">pricing</a>
            <a href="#mcp" className="hover:text-foreground">mcp</a>
            <a
              href="#docs"
              className="rounded-sm border border-hairline px-3 py-1.5 text-foreground hover:border-signal hover:text-signal"
            >
              read the docs
            </a>
          </nav>
        </div>
      </header>

      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
              Product data for agents
            </p>
            <h1 className="font-display mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Agents can decide what to buy.
              <br />
              <span className="text-muted-foreground">
                Reading the product page is where they still break.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Plinth reads it for them. One call turns a URL, a barcode, or a fuzzy
              name into a typed product object — sourced, confidence-scored, with
              the cost stamped in the response.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3 font-mono text-sm">
              <a
                href="#docs"
                className="inline-flex items-center gap-2 rounded-sm bg-signal px-4 py-2.5 font-medium text-ink transition-opacity hover:opacity-90"
              >
                Read the docs <span aria-hidden>→</span>
              </a>
              <a
                href="#hero"
                className="inline-flex items-center gap-2 rounded-sm border border-hairline px-4 py-2.5 text-foreground hover:border-foreground"
              >
                Run a call
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-hairline pt-6 font-mono text-xs">
              <div>
                <dt className="text-muted-foreground">p50 cached</dt>
                <dd className="mt-1 text-foreground">~80ms</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">per call</dt>
                <dd className="mt-1 text-foreground">from $0.01</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">payment</dt>
                <dd className="mt-1 text-foreground">key · x402</dd>
              </div>
            </dl>
          </div>

          <div id="hero" className="lg:pl-4">
            <div className="overflow-hidden rounded-md border border-hairline bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_60px_-30px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-signal/15 px-1.5 py-0.5 text-signal">POST</span>
                  <span className="text-muted-foreground">plinth.sh/v1/</span>
                  <span className="text-foreground">read_product</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className={`dot ${done ? "" : "animate-pulse"}`}
                    style={{ background: done ? "var(--verified)" : "var(--signal)" }}
                  />
                  <span>{done ? "200 OK" : "streaming"}</span>
                </div>
              </div>

              <div className="border-b border-hairline px-4 py-3 font-mono text-xs leading-relaxed">
                <span className="text-muted-foreground">{"{ "}</span>
                <span className="text-foreground">"url"</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-signal break-all">
                  "https://www.apple.com/shop/buy-mac/macbook-pro/16-inch"
                </span>
                <span className="text-muted-foreground">{" }"}</span>
              </div>

              <div className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>response</span>
                  <span>application/json</span>
                </div>
                <pre className="min-h-[460px] overflow-x-auto font-mono text-[12.5px] leading-[1.7] text-foreground">
                  {RESPONSE_LINES.slice(0, shown).map((l, i) => {
                    const isLast = i === shown - 1 && !done;
                    return (
                      <div
                        key={i}
                        className={`stream-line ${l.cls ?? ""} ${isLast ? "caret" : ""}`}
                      >
                        {l.text || "\u00A0"}
                      </div>
                    );
                  })}
                  {shown === 0 && <div className="caret">&nbsp;</div>}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>
                    method <span className="text-foreground">jsonld</span>
                  </span>
                  <span>
                    cached <span className="text-foreground">false</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    confidence{" "}
                    <span className="text-[color:var(--verified)]">{done ? "0.81" : "—"}</span>
                  </span>
                  <span className="text-muted-foreground">
                    cost <span className="text-signal">{done ? "$0.012" : "—"}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tools" className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-[260px_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              §01 · tools
            </p>
            <h2 className="font-display mt-3 text-2xl font-bold tracking-tight">
              Four questions an agent actually asks.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Not endpoints. The shape of the call matches the shape of the problem.
            </p>
          </div>
          <div className="divide-y divide-hairline border-y border-hairline">
            {TOOLS.map((t) => (
              <div
                key={t.name}
                className="grid grid-cols-[1fr_auto] items-center gap-6 py-5 font-mono text-sm"
              >
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-foreground">{t.name}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{t.desc}</span>
                  </div>
                </div>
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    t.live
                      ? "border-[color:var(--verified)]/40 text-[color:var(--verified)]"
                      : "border-hairline text-muted-foreground"
                  }`}
                >
                  {t.live ? "shipping" : "day 4"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="schema" className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-[260px_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              §02 · the object
            </p>
            <h2 className="font-display mt-3 text-2xl font-bold tracking-tight">
              Typed, sourced, scored.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Every field carries a confidence or an{" "}
              <code className="font-mono text-foreground">as_of</code>. Price is a
              band with a timestamp — never a single live number presented as truth.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { k: "canonical", v: "gtin · mpn · brand · model" },
              { k: "attributes", v: "normalized to category schema" },
              { k: "price.band", v: "low / high / currency + as_of" },
              { k: "source", v: "jsonld · opengraph · barcode_db · cache" },
              { k: "confidence", v: "0–1, per field and overall" },
              { k: "cost_usd", v: "stamped on every response" },
            ].map((f) => (
              <div
                key={f.k}
                className="rounded-md border border-hairline bg-surface p-5 font-mono text-sm"
              >
                <div className="text-signal">{f.k}</div>
                <div className="mt-1 text-muted-foreground">{f.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                §03 · pricing
              </p>
              <h2 className="font-display mt-3 text-2xl font-bold tracking-tight">
                Per call. No seats.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Devs pay with a key, metered through Stripe. Agents pay with USDC
                on Base via x402. Same core, same response.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "read_product (cached)", price: "~$0.01" },
                { name: "read_product (live)", price: "~$0.02" },
                { name: "resolve_product", price: "$0.03–0.05" },
                { name: "brief_product", price: "$0.05" },
              ].map((p) => (
                <div key={p.name} className="bg-background p-6 font-mono">
                  <div className="text-xs text-muted-foreground">{p.name}</div>
                  <div className="mt-3 text-2xl text-foreground">{p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="mcp" className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-[260px_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              §04 · surfaces
            </p>
            <h2 className="font-display mt-3 text-2xl font-bold tracking-tight">
              REST for you. MCP for them.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The same core, two surfaces. Devs hold a key. Agents discover the
              server and pay per call. No signup in the agent path.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-hairline bg-surface p-6">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span className="dot" style={{ background: "var(--verified)" }} />
                dev · REST
              </div>
              <pre className="mt-5 overflow-x-auto font-mono text-xs leading-relaxed text-foreground">
{`curl https://plinth.sh/v1/read_product \\
  -H "authorization: Bearer plinth_sk_…" \\
  -d '{ "url": "https://store.com/p/123" }'`}
              </pre>
            </div>
            <div className="rounded-md border border-hairline bg-surface p-6">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span className="dot" style={{ background: "var(--signal)" }} />
                agent · MCP + x402
              </div>
              <pre className="mt-5 overflow-x-auto font-mono text-xs leading-relaxed text-foreground">
{`mcp://plinth.sh
  tool: read_product
  pay:  USDC on Base
  → { …object, cost_usd: 0.012 }`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <footer id="docs">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-12 font-mono text-xs sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="dot" />
              <span className="font-display text-base font-bold text-foreground">
                plinth
              </span>
            </div>
            <p className="mt-3 max-w-sm text-muted-foreground">
              The foundation a product-aware agent stands on.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-muted-foreground">
            <a href="#tools" className="hover:text-foreground">tools</a>
            <a href="#schema" className="hover:text-foreground">schema</a>
            <a href="#pricing" className="hover:text-foreground">pricing</a>
            <a href="#mcp" className="hover:text-foreground">mcp</a>
            <span className="text-muted-foreground/60">/ status: pre-release</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
