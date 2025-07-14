import { defineConfig } from "@rslib/core";

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
      syntax: "es2021",
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
      syntax: "es2021",
    },
  ],
  output: {
    cleanDistPath: false,
    target: "node",
  },
  source: {
    entry: {
      index: ["./src/**/*.{ts,tsx}", "!**/*.{test,spec,e2e}.{ts,tsx}", "!**/__tests__/**", "!**/__mocks__/**"],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
