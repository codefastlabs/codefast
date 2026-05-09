import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * DI: Node + decorators; same SWC + coverage layout as CLI.
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
  oxc: false,
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        target: "esnext",
        transform: { decoratorVersion: "2023-11" },
      },
    }),
  ],
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
    include: [
      "tests/unit/**/*.test.?(c|m)[jt]s?(x)",
      "tests/integration/**/*.test.?(c|m)[jt]s?(x)",
      "tests/e2e/**/*.test.?(c|m)[jt]s?(x)",
      "tests/types/**/*.test.?(c|m)[jt]s?(x)",
    ],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
  },
});
