import { defineConfig } from "vitest/config";

/**
 * tailwind-variants: pure Node; tests under `tests/`, implementation under `src/`.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["{tests,src}/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)", "tests/**", "**/*.d.ts"],
    },
  },
});
