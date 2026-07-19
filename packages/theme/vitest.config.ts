import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Theme: React + jsdom; global browser mocks live in vitest.setup.ts.
 *
 * Test taxonomy (see TESTING.md):
 *   tests/unit/**         — unit tests (currently the only category in use)
 *   tests/integration/**  — pre-wired (none yet)
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — pre-wired (none yet)
 */
export default defineConfig({
  plugins: [react()],
  // jsdom tests resolve through the client pipeline, so `#/` is gated on the
  // `source` condition here (not `ssr.resolve`) to run against `src`, not `dist`.
  // Keep the React-relevant defaults so `react`/jsx still resolve correctly.
  resolve: {
    conditions: ["source", "module", "browser", "development"],
  },
  test: {
    coverage: {
      exclude: ["src/**/*.{test,stories}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "jsdom",
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts?(x)"],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
