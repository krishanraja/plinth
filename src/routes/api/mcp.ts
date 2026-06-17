import { createFileRoute } from "@tanstack/react-router";

const PAYMENT_REQUIRED = {
  scheme: "x402",
  network: "base-sepolia",
  asset: "USDC",
  max_amount: "0.05",
  recipient: process.env.X402_RECIPIENT ?? "0x0000000000000000000000000000000000000000",
  note: "Stubbed for v0.1. Wallet address to be set before launch.",
};

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const payment = request.headers.get("x-payment");
        // Allow API key OR x402 payment header
        if (!auth && !payment) {
          return new Response(JSON.stringify({ error: "payment_required", ...PAYMENT_REQUIRED }), {
            status: 402,
            headers: { "content-type": "application/json" },
          });
        }
        // Stub MCP response. Full mcp-tanstack-start wiring lands with tool execution.
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            result: { server: "plinth-mcp", version: "0.1", tools: ["read_product", "resolve_product"] },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
      GET: async () =>
        new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }), {
          status: 405,
          headers: { "content-type": "application/json", allow: "POST" },
        }),
    },
  },
});
