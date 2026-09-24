import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * UI test suite — primitives + hooks under jsdom + the Vite React plugin.
 * Files: `tests/{unit,integration,e2e,types}/**.test.ts?(x)`
 */
export default defineConfig({
  plugins: [react()],
  // jsdom tests resolve through the client pipeline, so `#` is gated on the
  // `source` condition here (not `ssr.resolve`) to run against `src`, not `dist`.
  // Keep the React-relevant defaults so `react`/jsx still resolve correctly.
  resolve: {
    conditions: ["source", "module", "browser", "development"],
  },
  test: {
    coverage: {
      exclude: ["src/**/*.test.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "jsdom",
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts?(x)"],
    // DOM one file leaves in the document breaks the next file's queries.
    isolate: true,
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    // Not a vm pool: the observer jsdom passes back fails `instanceof MutationObserver` across the realm.
    pool: "threads",
    setupFiles: ["./vitest.setup.ts"],
  },
});
