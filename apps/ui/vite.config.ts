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

// The `.ts` extension is required: Vite externalizes these imports out of the bundled config,
// so raw Node resolves them via package.json#imports — no extension probing, type-stripped.
import { DOC_KIND_BY_SLUG, docPath, docRefFor } from "#/features/package-docs/lib/doc-kinds.ts";
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
const ENTRY_PAGE_PATHS = ["/", "/docs", "/privacy", "/ui", "/ui/about", "/ui/components"];

/**
 * The ISR `/ui/components/<slug>` pages — one per `registry/<slug>/meta.ts`, mirroring
 * `_core/components.ts`'s auto-discovery, since `autoStaticPathsDiscovery` skips
 * param routes and link-crawling is off. Each entry opts out of prerendering (a page
 * defaults to `enabled: true` — a static file would shadow the ISR server function on
 * Vercel) and feeds the sitemap, alongside the auto-discovered static pages.
 */
function componentSlugPages(): Array<{ path: string; prerender: { enabled: boolean } }> {
  const registryDir = fileURLToPath(new URL("./src/registry", import.meta.url));

  return readdirSync(registryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(registryDir, entry.name, "meta.ts")))
    .map((entry) => ({ path: `/ui/components/${entry.name}`, prerender: { enabled: false } }));
}

/**
 * The markdown files a package may publish, relative to its directory: the files at its root, plus
 * everything under a directory named after a doc kind — the only directories the docs source globs.
 */
function packageMarkdownFiles(packageDir: string): Array<string> {
  const files: Array<string> = [];
  const walk = (directory: string, prefix: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = `${prefix}${entry.name}`;

      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(relative);
      } else if (entry.isDirectory() && (prefix !== "" || DOC_KIND_BY_SLUG.has(entry.name))) {
        walk(path.join(directory, entry.name), `${relative}/`);
      }
    }
  };

  walk(packageDir, "");

  return files;
}

/**
 * The prerendered `/docs/<pkg>[/<kind>[/<page>]]` pages — one per markdown document under `packages/*` (except
 * `ui`, which has its own section), addressed as `doc-kinds.ts` addresses them. Listed because
 * `autoStaticPathsDiscovery` skips param routes and link-crawling is off; the list also feeds the sitemap.
 */
function packageDocPages(): Array<{ path: string }> {
  const packagesDir = fileURLToPath(new URL("../../packages", import.meta.url));

  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "ui")
    .flatMap((entry) =>
      packageMarkdownFiles(path.join(packagesDir, entry.name)).flatMap((file) => {
        const ref = docRefFor(file);

        return ref ? [{ path: docPath(entry.name, ref.doc, ref.page) }] : [];
      }),
    );
}

/**
 * The `@codefast/ui` section moved from the site root to `/ui`. Every old URL — the gallery, each detail
 * page and its `.md` twin, Getting Started — answers a permanent redirect so indexed links and bookmarks
 * keep working. Emitted into Vercel's static routing, so no function runs for them.
 */
const LEGACY_REDIRECTS = {
  "/components": { redirect: { to: "/ui/components", status: 308 } },
  "/components/**": { redirect: { to: "/ui/components/**", status: 308 } },
  "/about": { redirect: { to: "/ui/about", status: 308 } },
} as const;

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
                // Only the matched example/doc modules go into a group chunk. Left on (the default), rolldown
                // also drags the group's dependencies in — the UI primitives every page needs ended up inside
                // `registry-*` chunks, and the entry preloaded 13 of them (~480 KB) on every page.
                includeDependenciesRecursively: false,
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
        pages: [...componentSlugPages(), ...packageDocPages()],
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
        routeRules: {
          ...Object.fromEntries(
            [...ENTRY_PAGE_PATHS, "/docs/**", "/og/**", ...publicCacheRoutePatterns()].map((pattern) => [
              pattern,
              { headers: { "cache-control": CONTENT_CACHE_CONTROL } },
            ]),
          ),
          ...LEGACY_REDIRECTS,
        },
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
