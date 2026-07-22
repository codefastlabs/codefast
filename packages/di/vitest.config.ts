import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vitest/config";

/**
 * DI: Node + Stage 3 decorators.
 *
 * Test taxonomy (see TESTING.md):
 *   tests/unit/**         — isolated unit tests
 *   tests/integration/**  — multi-module decorator/lifecycle integration; the
 *                           accessor-e2e.script.ts subprocess it drives is a SUPPORT
 *                           entrypoint, not a test, so it lives under support/.
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — static expect-type inference tests
 */
export default defineConfig({
  plugins: [
    babel({
      plugins: [
        [
          "@babel/plugin-proposal-decorators",
          {
            version: "2023-11",
          },
        ],
      ],
    }),
  ],
  // Resolve internal `#/` subpath imports to `src` (not the built `dist`): the
  // package's imports map gates dev/test on the `source` condition.
  // Vitest 4 resolves test modules through the SSR pipeline; gate `#/` on the
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
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
  },
});
