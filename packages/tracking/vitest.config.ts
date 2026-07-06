import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Tracking: isomorphic (client uses browser storage/beacon APIs, server is plain Node,
 * the react/ subpath needs jsdom + React Testing Library) — jsdom covers all three since
 * it only adds globals, it never removes Node's.
 *
 * Test taxonomy (see TESTING.md):
 *   tests/unit/**         — core/client/server/react unit tests
 *   tests/integration/**  — pre-wired (none yet)
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — catalog/EventsOf type-level tests
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
