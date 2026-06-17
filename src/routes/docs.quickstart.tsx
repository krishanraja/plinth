import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/docs/quickstart")({
  component: () => (
    <article className="space-y-6">
      <h1 className="font-display text-5xl">Quickstart</h1>
      <p className="text-lg text-muted-foreground">Create a key in the dashboard, then call the API.</p>
      <pre className="rounded-md border border-hairline bg-surface p-5 font-mono text-sm overflow-x-auto">
{`curl https://plinth.sh/v1/read_product \\
  -H "authorization: Bearer plk_…" \\
  -H "content-type: application/json" \\
  -d '{ "url": "https://www.apple.com/shop/buy-mac/macbook-pro/16-inch" }'`}
      </pre>
      <p className="text-muted-foreground">Response is a typed product object with a confidence score and the per-call cost.</p>
    </article>
  ),
});
