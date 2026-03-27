import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vitest/config";
import babel from "@rolldown/plugin-babel";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    // Allow tests to pass when no test files are found
    passWithNoTests: true,
  },
  resolve: {
    tsconfigPaths: true,
    // Ensure proper ESM resolution
    conditions: ["import", "module", "browser", "default"],
  },
  optimizeDeps: {
    // Exclude problematic packages from optimization
    exclude: ["nitro", "@tanstack/react-start"],
  },
  ssr: {
    // Configure SSR to handle CommonJS modules
    noExternal: ["react", "react-dom"],
  },
});
