import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/v1/resolve_product")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          JSON.stringify({ error: "external_worker_not_configured" }),
          { status: 503, headers: { "content-type": "application/json" } },
        ),
    },
  },
});
