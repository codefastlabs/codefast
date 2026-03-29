import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import babel from "@rolldown/plugin-babel";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import contentCollections from "@content-collections/vite";
import { exec } from "node:child_process";

const openInWebStorm = async (
  path: string,
  lineNumber: string | undefined,
  columnNumber?: string,
) => {
  const safePath = path.replaceAll("$", String.raw`\$`);
  exec(`webstorm --line ${lineNumber ?? 1} --column ${columnNumber ?? 1} "${safePath}"`);
};

const config = defineConfig(({ command }) => ({
  logLevel: command === "build" ? "warn" : "info",
  build: {
    reportCompressedSize: false,
  },
  resolve: {
    tsconfigPaths: true,
  },
  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
    // Prefer `import` / `module` in package `exports` during SSR so dependencies resolve to ESM builds
    // (avoids CJS `require("tslib")` + Rolldown `__toESM` interop issues). Nitro merges these with
    // production/development, `node`, etc. Do not use `nitro.alias` for bare specifiers like `tslib`—it is
    // wired through unenv and breaks resolution (e.g. duplicated path segments).
    exportConditions: ["import", "module", "default"],
  },
  plugins: [
    devtools({
      editor: {
        name: "WebStorm",
        open: openInWebStorm,
      },
    }),
    tailwindcss(),
    contentCollections(),
    tanstackStart(),
    nitro(),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
}));

export default config;
