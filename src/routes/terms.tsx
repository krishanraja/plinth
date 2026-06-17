import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
const Legal = (title: string, body: string) => () => (
  <div className="min-h-screen bg-background text-foreground">
    <SiteHeader />
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl">{title}</h1>
      <p className="mt-6 text-muted-foreground whitespace-pre-line">{body}</p>
      <p className="mt-12 text-xs text-muted-foreground">Last updated: June 2026. This is a stub — final text pending counsel review.</p>
    </main>
    <SiteFooter />
  </div>
);
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — Plinth" }] }),
  component: Legal("Terms of service", `By using Plinth you agree to fair-use rate limits, accurate billing, and to not abuse the API to scrape at scale outside of your subscribed plan.\n\nWe extract publicly available product data on your behalf and cache it. You are responsible for ensuring your downstream use complies with applicable laws and the source site's terms.`),
});
