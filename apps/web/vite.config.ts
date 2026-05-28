import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { exec } from "node:child_process";

const openInWebStorm = async (
  path: string,
  lineNumber: string | undefined,
  columnNumber?: string,
) => {
  const safePath = path.replaceAll("$", String.raw`\$`);
  exec(`webstorm --line ${lineNumber ?? 1} --column ${columnNumber ?? 1} "${safePath}"`);
};

export default defineConfig(({ command }) => ({
  resolve: {
    tsconfigPaths: true,
    // During `vite dev` prefer the `source` export condition so workspace
    // packages (e.g. @codefast/ui) resolve to their TypeScript source files
    // directly — no dist rebuild is needed between package edits.
    conditions: command === "serve" ? ["source"] : [],
  },
  plugins: [
    devtools({
      editor: {
        name: "WebStorm",
        open: openInWebStorm,
      },
    }),
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: "vercel" }),
    viteReact(),
  ],
}));
