import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * UI: React 19 + Testing Library; jsdom + Vite React plugin (Vitest 4 + JSX refresh/transform).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec,stories}.?(c|m)[jt]s?(x)", "**/*.d.ts"],
    },
  },
});
