import { codefastTheme } from "@codefast/theme/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// This app is a smoke test for the PUBLISHED `@codefast/*` packages: it deliberately
// consumes their built `dist/*.mjs` from npm, exactly like an external consumer would.
// Unlike `apps/ui`, it does NOT add the dev-only `source` resolve condition (which would
// map `@codefast/*` to their in-repo `src`), so what runs here is the real shipped artifact.
export default defineConfig({
  plugins: [
    // `@codefast/theme/start` ships TanStack Start server functions (`createServerFn`) inside its
    // published `dist`. `codefastTheme()` marks the package as non-externalized for SSR and not
    // pre-bundled for the client, so the Start plugin transforms those calls into registered RPC
    // endpoints — the wiring a real npm consumer needs. (apps/ui sidesteps this by resolving
    // @codefast/* to their `src` via the dev-only `source` condition.)
    codefastTheme(),
    tailwindcss(),
    tanstackStart(),
    // Build for Vercel via Nitro's `vercel` preset (emits the Build Output API `.vercel/output`).
    // Unlike apps/ui, no `source` exportCondition: this app consumes @codefast/* from their published
    // `dist`, so it must resolve via the always-on `import` condition, not the in-repo `src`.
    //
    // NOTE: react@19 keeps a runtime `require("react")` shim that node-file-trace can miss. If the
    // deployed function throws "Cannot find module 'react'", add `traceDeps: ["react", "react-dom"]`.
    nitro({
      preset: "vercel",
    }),
    viteReact(),
    // Babel does two things the Rolldown/oxc pipeline doesn't:
    //  1. Lowers `@codefast/di`'s TC39 Stage 3 decorators (`@injectable`, `@postConstruct`) — oxc only
    //     transforms *legacy* (`experimentalDecorators`) decorators, not the standard ones.
    //  2. Runs the React Compiler (auto-memoization), the same preset `apps/ui` uses.
    // No `include` filter is needed: each transform is a no-op where it doesn't apply.
    babel({
      presets: [reactCompilerPreset()],
      plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]],
    }),
  ],
});
