import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * DI: Node + decorators; same SWC + coverage layout as CLI.
 */
export default defineConfig({
  oxc: false,
  test: {
    benchmark: {
      include: ["src/**/*.bench.?(c|m)[jt]s?(x)"],
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.{test,spec,bench}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
    },
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { decoratorVersion: "2023-11" },
        target: "esnext",
      },
    }),
  ],
});
