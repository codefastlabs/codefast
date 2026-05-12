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
