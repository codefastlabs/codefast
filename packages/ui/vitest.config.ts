import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * UI: React 19 + Testing Library; jsdom + Vite React plugin (Vitest 4 + JSX refresh/transform).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      exclude: ["src/**/*.{test,stories}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.?(c|m)[jt]s?(x)"],
    /** Empty test tree is valid during refactors; `verify` must not fail. */
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
