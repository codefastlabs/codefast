import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      bundle: false,
      dts: {
        distPath: "./dist/types",
      },
      format: "esm",
      output: {
        distPath: {
          root: "./dist/esm",
        },
      },
    },
    {
      bundle: false,
      format: "cjs",
      output: {
        distPath: {
          root: "./dist/cjs",
        },
      },
    },
  ],
  output: {
    sourceMap: true,
  },
  performance: {
    buildCache: true,
    printFileSize: false,
  },
  source: {
    entry: {
      index: ["./src/**/*.{ts,tsx}", "!./src/**/*.{test,spec}.{ts,tsx}"],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
