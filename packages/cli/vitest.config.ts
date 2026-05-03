import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * CLI: Node, TypeScript decorators (DI-style) via SWC.
 * Pool defaults to `forks` (Vitest 4) — safer than `threads` for native / process APIs.
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
    /**
     * Split layout matches monorepo convention (`test:unit` / `test:integration` in package.json).
     * Default `pnpm test` still runs both via this array.
     */
    include: [
      "tests/unit/**/*.test.?(c|m)[jt]s?(x)",
      "tests/integration/**/*.test.?(c|m)[jt]s?(x)",
    ],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
  },
});
