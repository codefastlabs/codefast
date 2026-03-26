import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";
import path from "node:path";

// Determine if we're running in watch mode to adjust build behavior accordingly.
const isWatchMode = process.argv.includes("--watch");

export default defineConfig({
  lib: [
    {
      // Don't bundle dependencies - let the consuming application handle bundling.
      bundle: false,
      dts: true,
      format: "esm",
      output: {
        // Copy CSS files to the output directory for direct import.
        copy: [
          {
            context: path.resolve(__dirname, "src", "css"),
            from: "**/*",
            to: "css",
          },
        ],
      },
    },
    {
      // CommonJS format for Node.js compatibility.
      bundle: false,
      dts: false,
      format: "cjs",
    },
  ],
  output: {
    // Clean the dist directory before build but skip during watch mode for faster rebuilds.
    cleanDistPath: !isWatchMode,
    // Don't minify at the library level since Next.js/TanStack Start will minify during app build.
    // Rslib defaults for esm/cjs only perform dead code elimination and unused code elimination.
    target: "web",
  },
  performance: {
    // Enable build cache in watch mode to speed up incremental builds.
    buildCache: isWatchMode,
    // Print file sizes after build, but skip during watch mode to reduce noise.
    printFileSize: !isWatchMode,
  },
  plugins: [pluginReact()],
  source: {
    entry: {
      // Include all TypeScript/TSX files except test and story files.
      index: ["src/**/*.{ts,tsx}", "!src/**/*.{test,spec,e2e,story,stories}.{ts,tsx}"],
    },
    tsconfigPath: "tsconfig.build.json",
  },
});
