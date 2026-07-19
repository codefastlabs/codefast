import { defineConfig } from "vitest/config";

export default defineConfig({
  // Gate `#/` on `source` so tests run against `src`, not the built `dist`.
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
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
    passWithNoTests: true,
  },
});
