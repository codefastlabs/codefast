import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { CACHED_ROUTE_PATTERNS, CONTENT_CACHE_CONTROL } from "./src/lib/cache";

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
         * Prerenders every route reachable by crawling `<Link>`s from `/` — the gallery and
         * sidebar link to every component page — shipping static HTML for SEO and CDN delivery.
         * The built-in sitemap is generated from those same crawled pages into
         * `public/sitemap.xml`. `host` must match `SITE_URL` in `src/lib/seo.ts`.
         */
        prerender: {
          enabled: true,
          crawlLinks: true,
        },
        sitemap: {
          enabled: true,
          host: "https://codefastlabs.com",
        },
      }),
      nitro({
        preset: "vercel",
        /**
         * Sets `Cache-Control` for every prerendered page and cacheable `public/` file.
         *
         * Vercel's filesystem layer serves prerendered HTML directly, bypassing the server
         * function that a route's `headers()` would run in — so `routeRules` is the only hook
         * the Vercel adapter writes into the deployment's header config, making it the sole
         * path to a static file's deployed headers. (`**` is the rou3 wildcard for nested
         * paths; the preset emits it as a Vercel regex.) The `.md`/`llms.txt` twins set their
         * own `Cache-Control` in their handler instead, since they're never prerendered.
         *
         * `/__tsr/staticServerFnCache/**` covers the build-time output of static server
         * functions — the prerendered Shiki highlights. Vercel defaults it to
         * `max-age=0, must-revalidate`; keyed by function id and params rather than content,
         * it can't be `immutable`, so it shares the pages' freshness policy instead.
         */
        routeRules: Object.fromEntries(
          [...CACHED_ROUTE_PATTERNS, ...publicCacheRoutePatterns()].map((pattern) => [
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
