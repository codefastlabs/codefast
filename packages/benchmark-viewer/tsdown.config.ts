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
            name: "vendor",
            test: /node_modules/,
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
