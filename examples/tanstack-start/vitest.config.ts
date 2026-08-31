import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vitest/config";

/**
 * Example app tests: Node + Stage 3 decorators, consuming the built `@codefast/*` dist like the app.
 *
 * A standalone config so Vitest never loads vite.config.ts — the app's nitro/tanstack plugins have
 * no business in a unit-test run. Test taxonomy: tests/unit/** mirrors src/**.
 */
export default defineConfig({
  plugins: [
    babel({
      plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]],
    }),
  ],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
    passWithNoTests: true,
  },
});
