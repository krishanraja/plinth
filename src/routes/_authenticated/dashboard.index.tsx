import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: () => (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Welcome to Plinth</h1>
        <p className="mt-2 text-muted-foreground">Your account is being reviewed. We'll notify you by email when access is granted.</p>
      </div>
      <div className="rounded-md border border-hairline bg-surface p-6">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Status</div>
        <div className="mt-2 font-display text-2xl text-foreground">Pending approval</div>
        <p className="mt-3 text-sm text-muted-foreground">
          While you wait, browse the <a href="/docs" className="text-signal underline">docs</a> and the <a href="/docs/mcp" className="text-signal underline">MCP server</a>.
        </p>
      </div>
    </div>
  ),
});
