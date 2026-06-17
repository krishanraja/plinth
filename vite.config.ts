// Vercel-targeted TanStack Start config. Lovable toolchain removed (was @lovable.dev/vite-tanstack-config).
// Plugin set per Vercel's TanStack Start guide: https://vercel.com/docs/frameworks/full-stack/tanstack-start
// Vercel auto-detects TanStack Start + Nitro and runs on Fluid Compute; no explicit preset needed.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // @ -> src alias from tsconfig; must resolve before the framework plugins.
    tsConfigPaths(),
    // Route TanStack Start's server entry through src/server.ts (our SSR error wrapper).
    tanstackStart({ server: { entry: "server" } }),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});
