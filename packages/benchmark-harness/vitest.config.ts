import { defineConfig } from "vitest/config";

/**
 * benchmark-harness: pure Node package. Tests are organized by taxonomy:
 *   tests/unit/**         — fast, isolated unit tests (this package only ships these today)
 *   tests/integration/**  — multi-module / real-IO tests (none yet, pre-wired)
 *   tests/e2e/**          — end-to-end / subprocess tests (none yet, pre-wired)
 *   tests/types/**        — static type-only tests (none yet, pre-wired)
 *
 * See TESTING.md at the repo root for the full taxonomy.
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
