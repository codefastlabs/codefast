import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * DI: Node + decorators; same SWC + coverage layout as CLI.
 */
export default defineConfig({
  oxc: false,
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.integration.test.ts",
        "src/**/*.spec.ts",
        "**/*.d.ts",
      ],
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
