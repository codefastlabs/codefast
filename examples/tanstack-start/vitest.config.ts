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
      // A custom exclude replaces the plugin's node_modules default, so both go here: the linked
      // workspace dist is realpath'd outside node_modules and carries no decorator syntax to lower.
      exclude: [/[/\\]node_modules[/\\]/, /[/\\]dist[/\\]/],
      plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]],
    }),
  ],
  test: {
    coverage: {
      exclude: ["**/*.d.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts"],
  },
});
