/**
 * Vite plugin that wires `@codefast/theme`'s TanStack Start server functions into a consumer build.
 *
 * `@codefast/theme/start` ships `createServerFn()` calls inside its published `dist`. TanStack
 * Start registers each server function's RPC endpoint at **build time, in the consuming app**.
 * For that transform to run over this package, it must not be externalized for SSR nor
 * pre-bundled for the client — otherwise the endpoints never register and calls fail at runtime.
 *
 * This plugin applies exactly that, so consumers don't have to hand-write `ssr.noExternal` and
 * `optimizeDeps.exclude` themselves.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { codefastTheme } from "@codefast/theme/vite";
 * import { tanstackStart } from "@tanstack/react-start/plugin/vite";
 * import viteReact from "@vitejs/plugin-react";
 * import { defineConfig } from "vite";
 *
 * export default defineConfig({
 *   plugins: [codefastTheme(), tanstackStart(), viteReact()],
 * });
 * ```
 */

import type { Plugin } from "vite";

const PACKAGE_NAME = "@codefast/theme";

/**
 * Create the Vite plugin that lets a TanStack Start app consume `@codefast/theme`'s server
 * functions from npm without manual `ssr.noExternal` / `optimizeDeps.exclude` configuration.
 */
export function codefastTheme(): Plugin {
  return {
    name: "codefast:theme",
    config() {
      return {
        ssr: {
          noExternal: [PACKAGE_NAME],
        },
        optimizeDeps: {
          exclude: [PACKAGE_NAME],
        },
      };
    },
  };
}
