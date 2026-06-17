import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks · Plinth docs" }] }),
  component: () => (
    <article className="space-y-6">
      <h1 className="font-display text-5xl">Webhooks</h1>
      <p className="text-lg text-muted-foreground">
        Async results from <span className="font-mono">resolve_product</span>, billing events, and
        takedown notifications are delivered as signed HTTP POSTs to URLs you configure in the dashboard.
      </p>

      <h2 className="font-display text-2xl mt-8">Events</h2>
      <table className="w-full text-sm border border-hairline rounded-md overflow-hidden">
        <thead className="bg-surface font-mono text-xs uppercase tracking-widest text-muted-foreground text-left">
          <tr><th className="px-4 py-3">event</th><th className="px-4 py-3">when</th></tr>
        </thead>
        <tbody className="divide-y divide-hairline font-mono text-xs">
          {[
            ["resolution.completed", "An async resolve_product call finished."],
            ["resolution.failed", "The resolve could not complete above the confidence threshold."],
            ["cache.invalidated", "A cached product object was purged (TTL or manual)."],
            ["takedown.applied", "A URL you previously read was taken down."],
            ["billing.overage", "Your usage crossed your plan's included calls."],
          ].map(([e, w]) => (
            <tr key={e}><td className="px-4 py-3 text-foreground">{e}</td><td className="px-4 py-3 text-muted-foreground">{w}</td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="font-display text-2xl mt-8">Signature</h2>
      <p className="text-muted-foreground">
        Every delivery carries <span className="font-mono">x-plinth-signature</span>, an
        HMAC-SHA256 of the raw body using your webhook secret, hex-encoded.
      </p>
      <pre className="rounded-md border border-hairline bg-surface p-5 font-mono text-sm overflow-x-auto">
{`const expected = createHmac("sha256", process.env.PLINTH_WEBHOOK_SECRET)
  .update(rawBody)
  .digest("hex");

if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
  return new Response("bad signature", { status: 401 });
}`}
      </pre>

      <h2 className="font-display text-2xl mt-8">Retries</h2>
      <p className="text-muted-foreground">
        Non-2xx responses are retried with exponential backoff: 30s, 2m, 10m, 1h, 6h, 24h.
        After the final attempt the delivery is marked <span className="font-mono">failed</span>
        and surfaces in the dashboard. Endpoints should be idempotent on
        <span className="font-mono"> event.id</span>.
      </p>
    </article>
  ),
});
