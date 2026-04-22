import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * CLI: Node, TypeScript decorators (DI-style) via SWC.
 * Pool defaults to `forks` (Vitest 4) — safer than `threads` for native / process APIs.
 */
export default defineConfig({
  oxc: false,
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.?(c|m)[jt]s?(x)"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.{test,bench}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { decoratorVersion: "2023-11" },
        target: "esnext",
      },
    }),
  ],
});
