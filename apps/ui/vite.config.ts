import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SERVER_ONLY_SUBPATHS } from "@codefast/tracking/tooling/import-protection";
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
 * The static entry pages, as `autoStaticPathsDiscovery` will find them (every component
 * route without path params). Listed here only as the `routeRules` header targets: a
 * prerendered file bypasses the route's `headers()`, so its `Cache-Control` must come
 * from Vercel's static routing config instead. Prerendering itself needs no list — the
 * discovery merges these into `pages` automatically.
 */
const ENTRY_PAGE_PATHS = ["/", "/about", "/components", "/privacy"];

/**
 * The ISR `/components/<slug>` pages — one per `registry/<slug>/meta.ts`, mirroring
 * `_core/components.ts`'s auto-discovery, since `autoStaticPathsDiscovery` skips
 * param routes and link-crawling is off. Each entry opts out of prerendering (a page
 * defaults to `enabled: true` — a static file would shadow the ISR server function on
 * Vercel) and feeds the sitemap, alongside the auto-discovered static pages.
 */
function componentSlugPages(): Array<{ path: string; prerender: { enabled: boolean } }> {
  const registryDir = fileURLToPath(new URL("./src/registry", import.meta.url));

  return readdirSync(registryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(registryDir, entry.name, "meta.ts")))
    .map((entry) => ({ path: `/components/${entry.name}`, prerender: { enabled: false } }));
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
         * Denies the server-only `@codefast/tracking` lanes in the client environment at
         * build time — the default rules only cover local `*.server.*` files, and
         * node_modules specifiers need an explicit entry (merged with the defaults). The
         * list ships with the package, so a new server-only subpath can never go stale here.
         */
        importProtection: {
          client: {
            specifiers: [...SERVER_ONLY_SUBPATHS],
          },
        },
        /**
         * Hybrid ISR (TanStack Start style): `autoStaticPathsDiscovery` prerenders the
         * static entry pages for an instant, function-free first load; every
         * `/components/$slug` page is server-rendered on demand and CDN-cached via its
         * `headers()` (`Cache-Control` + `CDN-Cache-Control`, see `src/lib/cache.ts`). The
         * split is per route because the two are mutually exclusive per route on Vercel —
         * a prerendered file is served by `handle: filesystem` before the server function
         * is ever reached. `crawlLinks` must stay off (it defaults on): crawling an entry
         * page would discover and prerender every slug page, silently turning ISR back
         * into full static. The sitemap is built from the discovered pages plus the
         * declared slug pages. `host` must match `SITE_URL` in `src/lib/seo.ts`.
         */
        prerender: {
          enabled: true,
          crawlLinks: false,
        },
        pages: componentSlugPages(),
        sitemap: {
          enabled: true,
          host: "https://codefastlabs.com",
        },
      }),
      nitro({
        preset: "vercel",
        /**
         * Sets `Cache-Control` for every static file: the prerendered entry pages and the
         * cacheable `public/` files. Static files bypass the server, so `routeRules` (baked
         * into Vercel's static routing config) is the only path to their deployed headers.
         * The ISR slug pages are not here — they are live renders, and the route's
         * `headers()` is their canonical policy.
         */
        routeRules: Object.fromEntries(
          [...ENTRY_PAGE_PATHS, ...publicCacheRoutePatterns()].map((pattern) => [
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
