import path from "node:path";
import { fileURLToPath } from "node:url";

import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatchMode = process.argv.includes("--watch");

export default defineConfig({
  lib: [
    {
      bundle: false,
      dts: true,
      format: "esm",
      output: {
        distPath: {
          root: "./dist",
        },
      },
    },
  ],
  output: {
    cleanDistPath: !isWatchMode,
    copy: [
      {
        from: path.resolve(__dirname, "src", "styles", "index.css"),
        to: path.resolve(__dirname, "dist", "styles", "index.css"),
      },
    ],
    minify: !isWatchMode,
    target: "web",
  },
  performance: {
    printFileSize: !isWatchMode,
  },
  plugins: [pluginReact()],
  source: {
    entry: {
      index: ["./src/**/*.{ts,tsx}", "!src/**/*.{test,spec,e2e,story,stories}.{ts,tsx}"],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
