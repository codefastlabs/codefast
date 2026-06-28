import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { shikiPlugin } from "./vite.shiki";

// Standalone test config — Vitest picks this over `vite.config.ts`. The app's
// dev/build plugins (TanStack Start, Nitro, devtools) spin up an SSR server
// runner that errors and hangs teardown under the test runner, so the test
// environment only loads what the React component tests actually need.
// `shikiPlugin` stays in: the registry tests load `?shiki` source modules.
export default defineConfig({
  plugins: [shikiPlugin(), viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ["src/**/*.{test,stories}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "jsdom",
    include: ["tests/{unit,integration,e2e,types}/**/*.test.ts?(x)"],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
