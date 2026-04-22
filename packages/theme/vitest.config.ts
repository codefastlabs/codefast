import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Theme: React + jsdom; global browser mocks live in vitest.setup.ts.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.?(c|m)[jt]s?(x)"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.?(c|m)[jt]s?(x)", "**/*.d.ts"],
    },
  },
});
