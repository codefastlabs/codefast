import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * DI: Node + decorators; same SWC + coverage layout as CLI.
 */
export default defineConfig({
  oxc: false,
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        target: "esnext",
        transform: { decoratorVersion: "2023-11" },
      },
    }),
  ],
  test: {
    benchmark: {
      include: ["src/**/*.bench.?(c|m)[jt]s?(x)"],
    },
    coverage: {
      exclude: ["src/**/*.{test,bench}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.?(c|m)[jt]s?(x)"],
  },
});
