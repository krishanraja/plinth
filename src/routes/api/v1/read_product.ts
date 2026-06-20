import { createFileRoute } from "@tanstack/react-router";

// v1 REST: read_product. Thin proxy to the Plinth extraction worker over HTTPS.
// Body must contain exactly one of: url, gtin. Returns the worker's typed ProductEnvelope.
// TODO Phase 2: validate a plk_ API key and meter usage_events before this is announced/billed.
// Until then the endpoint stays undocumented as "live" and is unannounced.

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
            {
              error: "external_worker_not_configured",
              message: "read_product is temporarily unavailable.",
            },
            503,
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
          return json(
            { error: "invalid_request", message: "Provide exactly one of: url, gtin." },
            422,
          );
        }

        const payload: Record<string, unknown> = {};
        if (hasUrl) payload.url = b.url;
        if (hasGtin) payload.gtin = b.gtin;
        if (typeof b.min_confidence === "number") payload.min_confidence = b.min_confidence;

        try {
          const res = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${WORKER_TOKEN}`,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(25000),
          });
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: { "content-type": "application/json" },
          });
        } catch {
          return json(
            { error: "upstream_unavailable", message: "The extraction worker did not respond." },
            502,
          );
        }
      },
    },
  },
});
