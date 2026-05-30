import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { exec } from "node:child_process";
import babel from "@rolldown/plugin-babel";

const openInWebStorm = async (
  path: string,
  lineNumber: string | undefined,
  columnNumber?: string,
) => {
  const safePath = path.replaceAll("$", String.raw`\$`);
  exec(`webstorm --line ${lineNumber ?? 1} --column ${columnNumber ?? 1} "${safePath}"`);
};

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    resolve: {
      conditions: isDev ? ["source"] : ["module"],
      tsconfigPaths: true,
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
      nitro({
        preset: "vercel",
        exportConditions: isDev ? ["source"] : ["module"],
      }),
      viteReact(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
  };
});
