import babel from "@rolldown/plugin-babel";
import { defineConfig } from "tsdown";

export default defineConfig([
  // ① Node server — unbundled ESM (SSR + HTTP server)
  {
    entry: ["src/**/*.ts?(x)", "!src/**/*.test.ts?(x)", "!src/app/entry.tsx"],
    unbundle: true,
    platform: "node",
  },
  // ② Browser app — ESM with automatic vendor splitting
  //    vendor → chunks/vendor-[hash].js   (immutable, all node_modules)
  //    app code → entry.js                (no-cache, small)
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
            test: /node_modules/,
            // pnpm: .../node_modules/.pnpm/react@19/node_modules/react/index.js
            // npm:  .../node_modules/react/index.js
            // → take the last node_modules/ segment to get the real package name
            name(moduleId) {
              const parts = moduleId.split(/node_modules[\\/]/);
              const last = parts[parts.length - 1] ?? "";
              const match = /^(@[^\\/]+[\\/][^\\/]+|[^\\/]+)/.exec(last);
              return match ? `vendor-${match[1].replace("@", "").replace("/", "-")}` : "vendor";
            },
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
