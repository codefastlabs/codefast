import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      bundle: false,
      format: "esm",
      output: {
        distPath: {
          root: "./dist/esm",
        },
      },
    },
    {
      bundle: false,
      dts: {
        distPath: "./dist/types",
      },
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
    target: "web",
  },
  performance: {
    buildCache: true,
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
