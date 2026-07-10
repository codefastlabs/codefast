import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// The `.ts` extension is required: Vite externalizes this import out of the bundled config,
// so raw Node resolves it via package.json#imports — no extension probing, type-stripped.
import { CONTENT_CACHE_CONTROL } from "#/lib/cache.ts";

/**
 * The `public/` files excluded from `publicCacheRoutePatterns`, kept fresh on every crawl
 * rather than cached like the rest of `public/`.
 */
const PUBLIC_UNCACHED_FILES = new Set(["robots.txt"]);

/**
 * Returns the request paths for every cacheable file in `public/`.
 *
 * Scans the directory rather than listing filenames by hand, so a new favicon, logo, or OG
 * image is cached automatically. Each entry is unhashed but changes only on redeploy, so it
 * takes the same freshness policy as the app's pages.
 */
function publicCacheRoutePatterns(): Array<string> {
  return readdirSync(fileURLToPath(new URL("./public", import.meta.url)), { withFileTypes: true })
    .filter((entry) => entry.isFile() && !PUBLIC_UNCACHED_FILES.has(entry.name))
    .map((entry) => `/${entry.name}`);
}

/**
 * Every page path on the site, for the build-time sitemap. With prerendering off there is
 * no crawl to discover them, so this mirrors the registry's own auto-discovery: one
 * `/components/<slug>` per `registry/<slug>/meta.ts`, same rule `_core/components.ts` uses.
 */
function sitemapPages(): Array<{ path: string }> {
  const registryDir = fileURLToPath(new URL("./src/registry", import.meta.url));
  const componentPaths = readdirSync(registryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(registryDir, entry.name, "meta.ts")))
    .map((entry) => `/components/${entry.name}`);

  return ["/", "/about", "/components", "/privacy", ...componentPaths].map((pagePath) => ({ path: pagePath }));
}

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    /**
     * Groups each component's lazy-imported example into its own chunk, rather than one per
     * example, since the gallery would otherwise emit hundreds of tiny chunks. Client
     * environment only — Nitro manages its own chunking. Excludes `demo.tsx`, so a gallery
     * card's preview doesn't pull in that component's full docs.
     */
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [
                  {
                    name: (id: string) => {
                      const match = /[/\\]src[/\\]registry[/\\]([^/\\]+)[/\\](?:doc\.ts|[^/\\]+\.example\.tsx)$/.exec(
                        id,
                      );

                      return match ? `registry-${match[1]}` : undefined;
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    resolve: {
      /**
       * Resolves `@codefast/*` packages to their `src` entry points for HMR in dev via the
       * `source` condition, and keeps dual CJS/ESM third-party dependencies on their ESM
       * build in both dev and prod via `module` — avoiding the tslib `__extends` SSR interop
       * error. `source` is the only condition that differs between dev and prod; `@codefast/*`
       * packages have no `module` key, so they fall back to the always-on `import` condition
       * (`dist/*.mjs`) in prod.
       */
      conditions: isDev ? ["source", "module"] : ["module"],
      tsconfigPaths: true,
    },
    plugins: [
      devtools({
        /**
         * Opens the clicked element's source in WebStorm (Shift+Option+Command+click in the
         * TanStack Devtools overlay). Without this block the plugin defaults to VS Code.
         * Requires the `webstorm` CLI launcher on `PATH`.
         */
        editor: {
          name: "WebStorm",
          open: async (path, lineNumber, columnNumber) => {
            const { exec } = await import("node:child_process");

            exec(
              `webstorm --line ${lineNumber || 1} --column ${columnNumber || 1} "${path.replaceAll("$", String.raw`\$`)}"`,
            );
          },
        },
      }),
      tailwindcss(),
      tanstackStart({
        /**
         * ISR (TanStack Start style): no prerendering — every page is server-rendered on
         * demand and CDN-cached via each route's `headers()` (`Cache-Control` +
         * `CDN-Cache-Control`, see `src/lib/cache.ts`). A prerendered file would shadow the
         * server function on Vercel (`handle: filesystem` runs before the function route),
         * so ISR and prerender are mutually exclusive per route. `pages` feeds the sitemap
         * the paths the crawl used to discover. `host` must match `SITE_URL` in
         * `src/lib/seo.ts`.
         */
        prerender: {
          enabled: false,
        },
        pages: sitemapPages(),
        sitemap: {
          enabled: true,
          host: "https://codefastlabs.com",
        },
      }),
      nitro({
        preset: "vercel",
        /**
         * Sets `Cache-Control` for the cacheable `public/` files — static files bypass the
         * server, so `routeRules` (baked into Vercel's static routing config) is the only
         * path to their deployed headers. Pages are no longer here: with prerendering off
         * they are live renders, and each route's `headers()` is the canonical policy.
         */
        routeRules: Object.fromEntries(
          publicCacheRoutePatterns().map((pattern) => [
            pattern,
            { headers: { "cache-control": CONTENT_CACHE_CONTROL } },
          ]),
        ),
        exportConditions: isDev ? ["source", "module"] : ["module"],
        /**
         * Traces `react` and `react-dom` into the serverless function's `node_modules`.
         * `react@19` and `use-sync-external-store` are CJS-only, so the inlined shim keeps a
         * runtime `require("react")` that no export condition can turn into a static import —
         * without tracing, the deployed function throws "Cannot find module 'react'".
         */
        traceDeps: ["react", "react-dom"],
      }),
      viteReact(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
  };
});
