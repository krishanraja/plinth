import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  component: () => (
    <div>
      <h1 className="font-display text-4xl">Billing</h1>
      <p className="mt-3 text-muted-foreground">Plan, payment method, invoices. Stripe portal opens here once enabled.</p>
      <div className="mt-8 rounded-md border border-dashed border-hairline bg-surface p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground text-center">
        Stripe setup required — enable Stripe Payments to activate billing.
      </div>
    </div>
  ),
});
