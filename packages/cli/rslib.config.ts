import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      format: "esm",
    },
    {
      format: "cjs",
    },
  ],
  output: {
    sourceMap: true,
  },
  performance: {
    printFileSize: false,
  },
  source: {
    entry: {
      index: "./src/index.ts",
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
