import { defineConfig } from "vitest/config";

/**
 * benchmark-harness: pure Node package; tests live under `tests/`.
 */
export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.test.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.?(c|m)[jt]s?(x)"],
    passWithNoTests: true,
  },
});
