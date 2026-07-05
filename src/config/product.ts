// One source of truth for every public-facing URL, path, and demo input (PLAN F0.6).
// When onplinth.io DNS resolves (founder action F0.4), flip APP_ORIGIN here and nowhere else.

export const APP_ORIGIN = "https://plinth-tan.vercel.app";
export const API_BASE = `${APP_ORIGIN}/api/v1`;
export const MCP_URL = `${APP_ORIGIN}/api/mcp`;

// Demo input used in every copy-pasteable sample. A real GTIN that returns a real
// trusted object today (Barilla Spaghetti N.5 via the barcode path, confidence 0.745).
export const DEMO_GTIN = "8076800195057";

// The curl shown on the dashboard and in quickstart docs. Must succeed verbatim
// (with a real key substituted). Never point samples at a domain that does not resolve.
export const demoCurl = (keyPlaceholder = "plk_your_key") =>
  `curl -X POST ${API_BASE}/read_product \\
  -H "authorization: Bearer ${keyPlaceholder}" \\
  -H "content-type: application/json" \\
  -d '{"gtin":"${DEMO_GTIN}"}'`;
