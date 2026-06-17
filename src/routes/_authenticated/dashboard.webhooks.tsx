import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/dashboard/webhooks")({
  component: () => (
    <div>
      <h1 className="font-display text-4xl">Webhooks</h1>
      <p className="mt-3 text-muted-foreground">Receive <span className="font-mono">resolution.done</span> events for async resolves.</p>
      <div className="mt-8 rounded-md border border-dashed border-hairline bg-surface p-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Webhook management UI ships with your approval.
      </div>
    </div>
  ),
});
