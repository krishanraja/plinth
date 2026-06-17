import { createFileRoute } from "@tanstack/react-router";
const Stub = (title: string, body: string) => () => (
  <div>
    <h1 className="font-display text-4xl text-foreground">{title}</h1>
    <p className="mt-3 text-muted-foreground max-w-2xl">{body}</p>
    <div className="mt-8 rounded-md border border-dashed border-hairline bg-surface p-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
      Coming online with your approval.
    </div>
  </div>
);
export const Route = createFileRoute("/_authenticated/dashboard/keys")({
  component: Stub("API keys", "Create, rotate, and revoke your single secret key (plk_…). Shown once at creation. Store it safely."),
});
