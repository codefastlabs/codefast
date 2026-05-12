import { defineConfig } from "vitest/config";

/**
 * tailwind-variants: pure Node; tests under `tests/`, implementation under `src/`.
 *
 * Test taxonomy (see TESTING.md):
 *   tests/unit/**         — runtime unit tests
 *   tests/integration/**  — pre-wired (none yet)
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — static type-only tests using `expectTypeOf`
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
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
