import path from "node:path";
import { fileURLToPath } from "node:url";

import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  lib: [
    {
      bundle: false,
      dts: true,
      format: "esm",
      output: {
        distPath: {
          root: "./dist/esm",
        },
      },
    },
    {
      bundle: false,
      dts: true,
      format: "cjs",
      output: {
        distPath: {
          root: "./dist/cjs",
        },
      },
    },
  ],
  output: {
    cleanDistPath: false,
    copy: [
      {
        from: path.resolve(__dirname, "src", "styles", "index.css"),
        to: path.resolve(__dirname, "dist", "styles", "index.css"),
      },
    ],
    minify: {
      css: false,
    },
    target: "web",
  },
  plugins: [pluginReact()],
  source: {
    entry: {
      index: ["./src/**/*.{ts,tsx}", "!**/*.{test,spec,e2e,story,stories}.{ts,tsx}"],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
