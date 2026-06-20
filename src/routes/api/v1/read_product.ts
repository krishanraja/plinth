import { createFileRoute } from "@tanstack/react-router";

// v1 REST: read_product. Validates a plk_ API key, proxies {url|gtin} to the Plinth
// extraction worker, meters the call into usage_events, and returns the typed ProductEnvelope.

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/v1/read_product")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const WORKER_URL = process.env.PLINTH_EXTRACTOR_URL;
        const WORKER_TOKEN = process.env.PLINTH_EXTRACTOR_TOKEN;
        if (!WORKER_URL || !WORKER_TOKEN) {
          return json(
            { error: "external_worker_not_configured", message: "read_product is temporarily unavailable." },
            503,
          );
        }

        // API-key auth (plk_ as Bearer).
        const authz = request.headers.get("authorization");
        const presented = authz?.startsWith("Bearer ") ? authz.slice(7).trim() : null;
        const { validateApiKey } = await import("@/integrations/supabase/api-keys.server");
        const principal = await validateApiKey(presented);
        if (!principal) {
          return json(
            { error: "unauthorized", message: "Provide a valid plk_ API key as a Bearer token." },
            401,
          );
        }

        // Per-plan rate limit (60s window).
        const { rateCheck, rateHeaders } = await import("@/integrations/supabase/rate-limit.server");
        const rl = await rateCheck(principal.userId);
        const rlh = rateHeaders(rl);
        if (!rl.allowed) {
          return new Response(
            JSON.stringify({ error: "rate_limited", message: "Rate limit exceeded. Slow down or upgrade your plan." }),
            { status: 429, headers: { ...rlh, "retry-after": String(rl.reset), "content-type": "application/json" } },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        const b = (body ?? {}) as Record<string, unknown>;
        const hasUrl = typeof b.url === "string" && b.url.length > 0;
        const hasGtin = typeof b.gtin === "string" && b.gtin.length > 0;
        if (hasUrl === hasGtin) {
          return json({ error: "invalid_request", message: "Provide exactly one of: url, gtin." }, 422);
        }
        const payload: Record<string, unknown> = {};
        if (hasUrl) payload.url = b.url;
        if (hasGtin) payload.gtin = b.gtin;
        if (typeof b.min_confidence === "number") payload.min_confidence = b.min_confidence;

        const started = Date.now();
        let status = 502;
        let text = JSON.stringify({
          error: "upstream_unavailable",
          message: "The extraction worker did not respond.",
        });
        try {
          const res = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${WORKER_TOKEN}` },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(25000),
          });
          text = await res.text();
          status = res.status;
        } catch {
          /* upstream failure -> 502 below */
        }

        // Meter the call (best-effort; never fail the response on a metering error).
        let cost = 0;
        let cached = false;
        try {
          const env = JSON.parse(text) as { cost_usd?: number; cached?: boolean };
          if (typeof env.cost_usd === "number") cost = env.cost_usd;
          cached = Boolean(env.cached);
        } catch {
          /* non-JSON upstream body */
        }
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Awaited: serverless freezes the function after the response, so a fire-and-forget
          // write would be dropped. Meter the call and touch the key's last_used_at together.
          await Promise.all([
            supabaseAdmin.from("usage_events").insert({
              user_id: principal.userId,
              api_key_id: principal.keyId,
              tool: "read_product",
              endpoint: "/api/v1/read_product",
              cached,
              status,
              cost_usd: cost,
              latency_ms: Date.now() - started,
            }),
            supabaseAdmin
              .from("api_keys")
              .update({ last_used_at: new Date().toISOString() })
              .eq("id", principal.keyId),
          ]);
        } catch {
          /* metering best-effort */
        }

        return new Response(text, { status, headers: { ...rlh, "content-type": "application/json" } });
      },
    },
  },
});
