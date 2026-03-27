import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import babel from "@rolldown/plugin-babel";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import contentCollections from "@content-collections/vite";
import { exec } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const openInWebStorm = async (
  path: string,
  lineNumber: string | undefined,
  columnNumber?: string,
) => {
  const safePath = path.replaceAll("$", String.raw`\$`);
  exec(`webstorm --line ${lineNumber ?? 1} --column ${columnNumber ?? 1} "${safePath}"`);
};

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      tslib: require.resolve("tslib/tslib.es6.mjs"),
    },
  },
  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
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
});

export default config;
