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
          root: "./dist",
        },
      },
    },
  ],
  output: {
    cleanDistPath: !isWatchMode,
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
