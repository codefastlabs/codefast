import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vitest/config";

/**
 * DI testing: Node + Stage 3 decorators.
 *
 * The test beds instantiate decorated `@injectable` classes, so the decorator
 * transform is required here exactly as in `@codefast/di`. Test taxonomy:
 *   tests/unit/**   — isolated unit tests
 *   tests/types/**  — static type-inference tests (vitest expectTypeOf)
 */
export default defineConfig({
  plugins: [
    babel({
      plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]],
    }),
  ],
  // Vitest 4 resolves test modules through the SSR pipeline; gate `#/` on the
  // `source` condition so tests (and `@codefast/di`) run against `src`, not `dist`.
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
