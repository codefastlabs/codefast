import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vitest/config";

/**
 * DI: Node + Stage 3 decorators.
 *
 * Test taxonomy (see TESTING.md):
 *   tests/unit/**         — unit tests (api, types)
 *   tests/integration/**  — multi-module decorator/lifecycle integration
 *   tests/e2e/**          — pre-wired (none yet); the existing accessor-e2e.script.ts
 *                           is a SUPPORT subprocess driven by an integration test, not
 *                           a standalone test entrypoint, so it stays under
 *                           tests/integration/.
 *   tests/types/**        — pre-wired (none yet)
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
