import { defineConfig } from "tsdown";

export default defineConfig([
  // ① Library — unbundled ESM for Node (includes SSR server components)
  {
    entry: [
      "src/**/*.{ts,tsx}",
      "!src/**/*.test.{ts,tsx}",
      "!src/server/client/entry-client.tsx", // browser-only hydration entry
    ],
    unbundle: true,
    platform: "node",
  },
  // ② Browser viewer — bundled IIFE + PostCSS (Tailwind v4)
  {
    entry: { client: "src/server/client/entry-client.tsx" },
    platform: "browser",
    format: "iife",
    outDir: "dist/server/client",
    deps: { alwaysBundle: [/./] },
    outputOptions: {
      entryFileNames: "[name].js",
    },
    css: {
      transformer: "postcss",
      fileName: "styles.css",
    },
  },
]);
