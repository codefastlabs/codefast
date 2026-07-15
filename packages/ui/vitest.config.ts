import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * UI test suite — primitives + hooks under jsdom + the Vite React plugin.
 * Files: tests/{unit,integration,e2e,types}/**.test.ts?(x)
 */
export default defineConfig({
  plugins: [react()],
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
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
