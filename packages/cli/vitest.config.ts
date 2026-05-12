import { defineConfig } from "vitest/config";

/**
 * CLI: Node profile (no DI decorators).
 *
 * Test taxonomy (see TESTING.md):
 *   tests/unit/**         — unit tests
 *   tests/integration/**  — pre-wired (no integration tests yet)
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — pre-wired (none yet)
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
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
    passWithNoTests: true,
  },
});
