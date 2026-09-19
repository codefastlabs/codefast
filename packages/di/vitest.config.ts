import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vitest/config";

/**
 * DI: Node + Stage 3 decorators.
 *
 * Test taxonomy:
 *   tests/unit/**         — isolated unit tests
 *   tests/integration/**  — multi-module decorator/lifecycle integration; the
 *                           accessor-e2e.script.ts subprocess it drives is a SUPPORT
 *                           entrypoint, not a test, so it lives under support/.
 *   tests/e2e/**          — pre-wired (none yet)
 *   tests/types/**        — static type-inference tests (vitest expectTypeOf)
 */
export default defineConfig({
  plugins: [
    babel({
      plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]],
    }),
  ],
  // Resolve internal `#` subpath imports to `src` (not the built `dist`): the
  // package's imports map gates dev/test on the `source` condition.
  // Vitest 4 resolves test modules through the SSR pipeline; gate `#` on the
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
      // A floor a little under where the suite stands, so a lane that loses its tests is a red run
      // rather than a discovery; raise it when the suite does, never lower it to pass.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
    environment: "node",
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
  },
});
