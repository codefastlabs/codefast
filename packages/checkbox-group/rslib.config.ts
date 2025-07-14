import { pluginReact } from "@rsbuild/plugin-react";
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
    target: "web",
  },
  plugins: [pluginReact()],
  source: {
    entry: {
      index: ["./src/**/*.{ts,tsx}", "!**/*.{test,spec,e2e}.{ts,tsx}", "!**/__tests__/**", "!**/__mocks__/**"],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
});
