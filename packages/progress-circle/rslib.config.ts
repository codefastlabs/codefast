import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";

const isWatchMode = process.argv.includes("--watch");

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
    cleanDistPath: !isWatchMode,
    minify: !isWatchMode,
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
