import { defineConfig } from "vitest/config";

/**
 * tailwind-variants: pure Node; tests under `tests/`, implementation under `src/`.
 *
 * Test taxonomy:
 *   tests/unit/**         — runtime unit tests
 *   tests/integration/**  — pre-wired (none yet)
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — static type-only tests using `expectTypeOf`
 */
export default defineConfig({
  // Vitest 4 resolves test modules through the SSR pipeline; gate `#` on the
  // `source` condition there so tests run against `src`, not the built `dist`.
  ssr: {
    resolve: {
      conditions: ["source"],
    },
  },
  test: {
    coverage: {
      exclude: ["src/**/*.test.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    fsModuleCache: true,
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
    // Pure functions with no mocks and only a config-keyed memo, so files can share a worker.
    isolate: false,
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    pool: "threads",
    setupFiles: ["./vitest.setup.ts"],
  },
});
