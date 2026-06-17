import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/docs/api/resolve-product")({
  component: () => (
    <article className="space-y-6">
      <h1 className="font-display text-5xl">resolve_product</h1>
      <p className="text-lg text-muted-foreground">Fuzzy strings → canonical identifiers. Async: returns a resolution id; finished result is delivered via webhook or poll.</p>
      <pre className="rounded-md border border-hairline bg-surface p-5 font-mono text-sm overflow-x-auto">
{`POST /v1/resolve_product
{ "query": "macbook pro 16 m3 pro space black 1tb" }

→ { "id": "res_…", "status": "pending" }

GET /v1/resolutions/{id}
→ { "status": "done", "result": {...}, "confidence": 0.74, "cost_usd": 0.043 }`}
      </pre>
      <p className="text-muted-foreground">Only resolutions with confidence ≥ 0.7 are cached.</p>
    </article>
  ),
});
