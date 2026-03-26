import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    devtools(),
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
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
