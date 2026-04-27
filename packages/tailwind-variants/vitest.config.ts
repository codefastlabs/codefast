import { defineConfig } from "vitest/config";

/**
 * tailwind-variants: pure Node; tests under `tests/`, implementation under `src/`.
 */
export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.{test,bench}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.?(c|m)[jt]s?(x)"],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
