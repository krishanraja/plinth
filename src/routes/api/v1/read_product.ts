import { createFileRoute } from "@tanstack/react-router";

// v1 REST stub. The real implementation runs on the external worker;
// this route is here so docs URLs resolve in preview and returns a friendly
// 503 until the worker is wired in.
export const Route = createFileRoute("/api/v1/read_product")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          JSON.stringify({
            error: "external_worker_not_configured",
            message: "read_product is served by the Plinth worker (see /docs).",
          }),
          { status: 503, headers: { "content-type": "application/json" } },
        ),
    },
  },
});
