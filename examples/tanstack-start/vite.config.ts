import { codefastTheme } from "@codefast/theme/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Smoke test for the published @codefast/* packages: consumes their npm dist/, like a real consumer.
export default defineConfig({
  plugins: [
    // Wire @codefast/theme's server functions into the build.
    codefastTheme(),
    tailwindcss(),
    tanstackStart(),
    // Build for Vercel (Nitro Build Output API → .vercel/output).
    nitro({
      preset: "vercel",
    }),
    viteReact(),
    // Lower @codefast/di's standard decorators and run the React Compiler.
    babel({
      presets: [reactCompilerPreset()],
      plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]],
    }),
  ],
});
