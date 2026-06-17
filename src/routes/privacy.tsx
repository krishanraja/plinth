import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy · Plinth" }] }),
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-5xl">Privacy</h1>
        <p className="mt-6 text-muted-foreground">
          We collect the minimum needed to operate the API: email for sign-in, API key metadata, and per-call usage events (no request bodies are stored beyond what's needed to cache the product object).
        </p>
        <p className="mt-4 text-muted-foreground">No PII is stored in the product cache. Cache entries expire on TTL and can be purged on request via the takedown form.</p>
        <p className="mt-12 text-xs text-muted-foreground">Last updated: June 2026. Stub pending counsel review.</p>
      </main>
      <SiteFooter />
    </div>
  ),
});
