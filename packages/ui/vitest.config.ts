import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * UI test suite — two Vitest projects sharing one (root-level) coverage config:
 *
 *   unit       — primitives + hooks (jsdom + Vite React plugin, Vitest 4).
 *                Files: tests/{unit,integration,e2e,types}/**.test.ts?(x)
 *   storybook  — stories run as component tests in a real browser (Playwright
 *                Chromium) via @storybook/addon-vitest. Stronger than jsdom for
 *                Radix portals/focus/positioning + a11y. Files: stories/**.stories
 *
 * Run all: `vitest run`. Run one: `vitest run --project=unit|storybook`.
 */
export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.{test,stories}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    /**
     * Browser-mode story files are flaky under file parallelism (concurrent
     * Playwright pages overwhelm the Vite dev server → "Failed to fetch
     * dynamically imported module" cascades). Serialize for deterministic runs;
     * the jsdom unit suite is fast enough that this costs little.
     */
    fileParallelism: false,
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    projects: [
      {
        plugins: [react()],
        test: {
          environment: "jsdom",
          globals: true,
          include: ["tests/{unit,integration,e2e,types}/**/*.test.ts?(x)"],
          name: "unit",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        plugins: [storybookTest({ configDir: ".storybook" })],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
          },
          name: "storybook",
        },
      },
    ],
  },
});
