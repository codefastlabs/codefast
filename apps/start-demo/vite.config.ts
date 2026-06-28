import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// This app is a smoke test for the PUBLISHED `@codefast/*` packages: it deliberately
// consumes their built `dist/*.mjs` from npm, exactly like an external consumer would.
// Unlike `apps/web`, it does NOT add the dev-only `source` resolve condition (which would
// map `@codefast/*` to their in-repo `src`), so what runs here is the real shipped artifact.
export default defineConfig({
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
  // `@codefast/theme/start` ships TanStack Start server functions (createServerFn) inside its
  // published `dist`. Those calls must flow through the Start plugin's transform to be registered
  // as RPC endpoints, so the package must NOT be externalized for SSR nor pre-bundled for the
  // client. (apps/web sidesteps this by resolving @codefast/* to their `src` via the dev-only
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
