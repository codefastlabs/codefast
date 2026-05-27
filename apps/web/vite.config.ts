import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  resolve: {
    tsconfigPaths: true,
    // During `vite dev` prefer the `source` export condition so workspace
    // packages (e.g. @codefast/ui) resolve to their TypeScript source files
    // directly — no dist rebuild is needed between package edits.
    conditions: command === "serve" ? ["source"] : [],
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro({ preset: "vercel" }), viteReact()],
}));
