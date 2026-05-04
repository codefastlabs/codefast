import { defineConfig } from "vitest/config";

/**
 * CLI: Node profile (no DI decorators).
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
    include: [
      "tests/unit/**/*.test.?(c|m)[jt]s?(x)",
      "tests/integration/**/*.test.?(c|m)[jt]s?(x)",
    ],
    passWithNoTests: true,
  },
});
