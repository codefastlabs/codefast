import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// This app is a smoke test for the PUBLISHED `@codefast/*` packages: it deliberately
// consumes their built `dist/*.mjs` from npm, exactly like an external consumer would.
// Unlike `apps/ui`, it does NOT add the dev-only `source` resolve condition (which would
// map `@codefast/*` to their in-repo `src`), so what runs here is the real shipped artifact.
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
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
  // `@codefast/theme/start` ships TanStack Start server functions (createServerFn) inside its
  // published `dist`. Those calls must flow through the Start plugin's transform to be registered
  // as RPC endpoints, so the package must NOT be externalized for SSR nor pre-bundled for the
  // client. (apps/ui sidesteps this by resolving @codefast/* to their `src` via the dev-only
  // `source` condition; a real npm consumer needs this instead.)
  //
  // From the next @codefast/theme release this block is replaced by the bundled plugin —
  // `import { codefastTheme } from "@codefast/theme/vite"` then add `codefastTheme()` to `plugins`.
  // It's inlined here only because the pinned 0.4.0 predates that plugin.
  ssr: {
    noExternal: ["@codefast/theme"],
  },
  optimizeDeps: {
    exclude: ["@codefast/theme"],
  },
});
