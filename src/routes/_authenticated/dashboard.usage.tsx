import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/dashboard/usage")({
  component: () => (
    <div>
      <h1 className="font-display text-4xl">Usage</h1>
      <p className="mt-3 text-muted-foreground">Calls, cost, cached vs live — this billing period.</p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[["Calls","0"],["Cost","$0.00"],["Cached %","—"]].map(([k,v]) => (
          <div key={k} className="rounded-md border border-hairline bg-surface p-5">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="font-display text-3xl mt-2">{v}</div>
          </div>
        ))}
      </div>
    </div>
  ),
});
