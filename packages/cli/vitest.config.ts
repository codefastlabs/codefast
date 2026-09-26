import { defineConfig } from "vitest/config";

/**
 * CLI: Node profile (no DI decorators).
 *
 * Test taxonomy:
 *   tests/unit/**         — unit tests
 *   tests/integration/**  — real files in a temp directory
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — pre-wired (none yet)
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
    // Reading cached transforms back is no faster than redoing them for this suite.
    fsModuleCache: false,
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
    // The config loader caches per directory for the process, so each file keeps its own module state.
    isolate: true,
    passWithNoTests: true,
    pool: "threads",
  },
});
