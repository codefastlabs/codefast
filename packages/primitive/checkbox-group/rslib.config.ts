import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";

const isProduction = process.env.NODE_ENV === "production";

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
