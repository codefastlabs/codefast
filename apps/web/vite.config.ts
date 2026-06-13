import { exec } from "node:child_process";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { shikiPlugin } from "./vite-plugin-shiki";

const openInWebStorm = async (path: string, lineNumber: string | undefined, columnNumber?: string) => {
  const safePath = path.replaceAll("$", String.raw`\$`);
  exec(`webstorm --line ${lineNumber ?? 1} --column ${columnNumber ?? 1} "${safePath}"`);
};

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    resolve: {
      // `source` (dev only) resolves @codefast/* packages to their `src` entry points for HMR; `module` keeps dual
      // CJS/ESM third-party deps on their ESM build in both dev and prod (avoids the tslib `__extends` SSR interop
      // error). The only dev↔prod difference is the `source` opt-in. @codefast/* packages have no `module` key, so
      // they fall back to the always-on `import` condition (→ dist/*.mjs) in prod.
      conditions: isDev ? ["source", "module"] : ["module"],
      tsconfigPaths: true,
    },
    plugins: [
      shikiPlugin(),
      devtools({
        editor: {
          name: "WebStorm",
          open: openInWebStorm,
        },
      }),
      tailwindcss(),
      tanstackStart(),
      nitro({
        preset: "vercel",
        exportConditions: isDev ? ["source", "module"] : ["module"],
        // react@19 and use-sync-external-store are CJS-only, so the inlined shim keeps a runtime `require("react")`
        // that no export condition can turn into a static import. Trace react/react-dom so they end up in the
        // serverless function's node_modules; otherwise the deployed function throws "Cannot find module 'react'".
        traceDeps: ["react", "react-dom"],
      }),
      viteReact(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{ name: "recharts", test: /[/\\]recharts[/\\]/ }],
          },
        },
      },
    },
  };
});
