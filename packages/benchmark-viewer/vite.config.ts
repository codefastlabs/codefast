import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Browser-app lane: bundles `src/app/entry.tsx` into `dist/app/` (the Node lane is
 * plain tsc — see tsconfig.build.json). Emits the fixed asset names the SSR shell
 * references (`/entry.js`, `/styles.css`) plus hashed vendor chunks under `chunks/`.
 * `emptyOutDir: false` preserves the tsc-emitted Node output already in `dist/`.
 */
export default defineConfig({
  // Resolve internal `#/` to `src` so the browser entry bundles TS source, not `dist`.
  resolve: {
    conditions: ["source", "module", "browser"],
  },
  // Tailwind v4 via its dedicated Vite plugin — the recommended integration for Vite bundles.
  plugins: [tailwindcss(), viteReact(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    outDir: "dist/app",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/app/entry.tsx",
      output: {
        entryFileNames: "entry.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (asset) =>
          (asset.names ?? []).some((name) => name.endsWith(".css")) ? "styles.css" : "assets/[name]-[hash][extname]",
        codeSplitting: {
          groups: [{ name: "vendor", test: /node_modules/ }],
        },
      },
    },
  },
});
