import babel from "@rolldown/plugin-babel";
import { defineConfig } from "tsdown";

export default defineConfig([
  // ① Node server — unbundled ESM (SSR + HTTP server)
  {
    entry: ["src/**/*.ts?(x)", "!src/**/*.test.ts?(x)", "!src/app/entry.tsx"],
    unbundle: true,
    platform: "node",
  },
  // ② Browser app — ESM with fine-grained code splitting + PostCSS (Tailwind v4)
  //    react-vendor  → chunks/react-vendor-[hash].js   (immutable, ~900 kB)
  //    chart-vendor  → chunks/chart-vendor-[hash].js   (immutable, ~600 kB)
  //    app code      → entry.js                         (no-cache, small)
  {
    entry: {
      entry: "src/app/entry.tsx",
    },
    platform: "browser",
    format: "esm",
    outDir: "dist/app",
    plugins: [
      babel({
        plugins: ["babel-plugin-react-compiler"],
      }),
    ],
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
          {
            name: "chart-vendor",
            test: /node_modules[\\/](chart\.js|chartjs-plugin-zoom|hammerjs)/,
            priority: 9,
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
