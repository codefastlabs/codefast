import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      bundle: true,
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
      bundle: true,
      format: "cjs",
      output: {
        distPath: {
          root: "./dist/cjs",
        },
      },
    },
  ],
  output: {
    minify: true,
    sourceMap: true,
  },
  source: {
    entry: {
      index: ["./src/index.ts"],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
