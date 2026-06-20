import { createFileRoute } from "@tanstack/react-router";

// MCP server (JSON-RPC 2.0 over HTTP POST). Feature-identical to the REST read_product:
// validates a plk_ key, dispatches tools/call to the extraction worker, meters usage_events.
// No valid key -> HTTP 402 with an x402 quote (agent-native discovery; settlement lands at GA).

const PROTOCOL = "2025-06-18";

const TOOLS = [
  {
    name: "read_product",
    description:
      "Resolve a product URL or GTIN into a typed Schema.org Product object with per-field and overall confidence, a price band, source method, and the per-call cost.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Product page URL" },
        gtin: { type: "string", description: "GTIN / UPC / EAN barcode" },
        min_confidence: { type: "number", description: "Override the 0.7 trust gate (0 to 1)" },
      },
    },
  },
];

function rpc(id: unknown, result: unknown) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, result }), {
    headers: { "content-type": "application/json" },
  });
}
function rpcError(id: unknown, code: number, message: string) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }), {
    headers: { "content-type": "application/json" },
  });
}
function toolResult(id: unknown, text: string, isError = false) {
  return rpc(id, { content: [{ type: "text", text }], isError });
}

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: a valid plk_ key gates the whole endpoint. No/invalid key -> 402 x402 quote.
        const authz = request.headers.get("authorization");
        const presented = authz?.startsWith("Bearer ") ? authz.slice(7).trim() : null;
        const { validateApiKey } = await import("@/integrations/supabase/api-keys.server");
        const principal = await validateApiKey(presented);
        if (!principal) {
          return new Response(
            JSON.stringify({
              error: "payment_required",
              scheme: "x402",
              network: "base-sepolia",
              asset: "USDC",
              max_amount: "0.05",
              recipient: process.env.X402_RECIPIENT ?? "0x0000000000000000000000000000000000000000",
              note: "Provide a plk_ API key as a Bearer token. x402 settlement lands at GA.",
            }),
            { status: 402, headers: { "content-type": "application/json" } },
          );
        }

        let body: { id?: unknown; method?: string; params?: Record<string, unknown> };
        try {
          body = await request.json();
        } catch {
          return rpcError(null, -32700, "Parse error");
        }
        const { id, method, params } = body ?? {};

        switch (method) {
          case "initialize":
            return rpc(id, {
              protocolVersion: (params?.protocolVersion as string) ?? PROTOCOL,
              capabilities: { tools: {} },
              serverInfo: { name: "plinth-mcp", version: "0.2" },
            });
          case "notifications/initialized":
          case "initialized":
            return new Response(null, { status: 202 });
          case "ping":
            return rpc(id, {});
          case "tools/list":
            return rpc(id, { tools: TOOLS });
          case "tools/call": {
            const name = params?.name as string | undefined;
            const args = (params?.arguments ?? {}) as Record<string, unknown>;
            if (name !== "read_product") {
              return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
            }
            const hasUrl = typeof args.url === "string" && (args.url as string).length > 0;
            const hasGtin = typeof args.gtin === "string" && (args.gtin as string).length > 0;
            if (hasUrl === hasGtin) {
              return toolResult(
                id,
                JSON.stringify({ error: "invalid_request", message: "Provide exactly one of: url, gtin." }),
                true,
              );
            }

            const WORKER_URL = process.env.PLINTH_EXTRACTOR_URL;
            const WORKER_TOKEN = process.env.PLINTH_EXTRACTOR_TOKEN;
            if (!WORKER_URL || !WORKER_TOKEN) {
              return toolResult(id, JSON.stringify({ error: "external_worker_not_configured" }), true);
            }
            const payload: Record<string, unknown> = {};
            if (hasUrl) payload.url = args.url;
            if (hasGtin) payload.gtin = args.gtin;
            if (typeof args.min_confidence === "number") payload.min_confidence = args.min_confidence;

            const started = Date.now();
            let text = JSON.stringify({ error: "upstream_unavailable" });
            let status = 502;
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
              /* upstream failure */
            }

            let cost = 0;
            let cached = false;
            try {
              const env = JSON.parse(text) as { cost_usd?: number; cached?: boolean };
              if (typeof env.cost_usd === "number") cost = env.cost_usd;
              cached = Boolean(env.cached);
            } catch {
              /* non-JSON */
            }
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await Promise.all([
                supabaseAdmin.from("usage_events").insert({
                  user_id: principal.userId,
                  api_key_id: principal.keyId,
                  tool: "read_product",
                  endpoint: "/api/mcp",
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
            return toolResult(id, text);
          }
          default:
            return rpcError(id, -32601, `Method not found: ${String(method)}`);
        }
      },
      GET: async () =>
        new Response(
          JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }),
          { status: 405, headers: { "content-type": "application/json", allow: "POST" } },
        ),
    },
  },
});
