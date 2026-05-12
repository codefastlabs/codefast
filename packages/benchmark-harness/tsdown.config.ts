import { defineConfig } from "tsdown";

export default defineConfig([
  // ① Library — unbundled ESM for Node (includes SSR server components)
  {
    entry: ["src/**/*.ts?(x)", "!src/**/*.test.ts?(x)", "!src/server/client/entry-client.tsx"],
    unbundle: true,
    platform: "node",
  },
  // ② Browser viewer — ESM + code splitting + PostCSS (Tailwind v4)
  //    React → chunks/react-vendor-[hash].js  (static import, immutable cache)
  //    chart.js + chartjs-plugin-zoom → chunks/*-[hash].js  (lazy import)
  {
    entry: {
      client: "src/server/client/entry-client.tsx",
    },
    platform: "browser",
    format: "esm",
    outDir: "dist/server/client",
    deps: {
      alwaysBundle: [/./],
      onlyBundle: false,
    },
    outputOptions: {
      entryFileNames: "[name].js",
      chunkFileNames: "chunks/[name]-[hash].js",
      codeSplitting: {
        groups: [
          {
            name: "react-vendor",
            test: /node_modules[\\/](react|react-dom|scheduler)/,
            priority: 10,
          },
        ],
      },
    },
    css: {
      transformer: "postcss",
      fileName: "styles.css",
    },
  },
]);
