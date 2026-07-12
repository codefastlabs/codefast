import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Standalone test config — Vitest picks this over `vite.config.ts`. The app's
// dev/build plugins (TanStack Start, Nitro, devtools) spin up an SSR server
// runner that errors and hangs teardown under the test runner, so the unit
// project only loads what the React component tests actually need.
//
// E2E lives in its own Node project: Playwright drives a real browser against
// the running app (started by globalSetup when localhost:3000 is down).
export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.{test,stories}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    projects: [
      {
        plugins: [viteReact()],
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          environment: "jsdom",
          include: ["tests/{unit,integration,types}/**/*.test.ts?(x)"],
          name: "unit",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        test: {
          environment: "node",
          fileParallelism: false,
          globalSetup: ["./tests/e2e/support/global-setup.ts"],
          hookTimeout: 120_000,
          include: ["tests/e2e/**/*.test.ts"],
          name: "e2e",
          testTimeout: 90_000,
        },
      },
    ],
  },
});
