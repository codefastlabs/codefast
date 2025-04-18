import { defineConfig } from "@rslib/core";

const isProduction = process.env.NODE_ENV === "production";

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
    cleanDistPath: isProduction,
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
