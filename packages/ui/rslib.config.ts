import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isProduction = process.env.NODE_ENV === "production";
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
    cleanDistPath: isProduction,
    copy: [
      {
        from: path.resolve(__dirname, "src", "styles", "index.css"),
        to: path.resolve(__dirname, "dist", "styles", "index.css"),
      },
    ],
    minify: {
      css: false,
    },
    sourceMap: true,
    target: "web",
  },
  performance: {
    printFileSize: false,
  },
  plugins: [pluginReact()],
  source: {
    entry: {
      index: ["./src/**/*.{ts,tsx}", "!./src/**/*.{test,spec}.{ts,tsx}"],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
