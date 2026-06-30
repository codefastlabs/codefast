import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { CONTENT_CACHE_CONTROL } from "./src/lib/cache";

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    // One chunk per component: each example is a lazy import, so without grouping
    // the client emits hundreds of tiny chunks. Client env only (nitro sets its
    // own); demo.tsx stays separate so gallery cards don't pull a component's docs.
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
      // `source` (dev only) resolves @codefast/* packages to their `src` entry points for HMR; `module` keeps dual
      // CJS/ESM third-party deps on their ESM build in both dev and prod (avoids the tslib `__extends` SSR interop
      // error). The only dev↔prod difference is the `source` opt-in. @codefast/* packages have no `module` key, so
      // they fall back to the always-on `import` condition (→ dist/*.mjs) in prod.
      conditions: isDev ? ["source", "module"] : ["module"],
      tsconfigPaths: true,
    },
    plugins: [
      devtools({
        // Click an element in the TanStack Devtools overlay (Shift+Option+Command+click) to open
        // its source in WebStorm. Without this `editor` block the plugin falls back to its default
        // (VS Code), so WebStorm never opens. Requires the `webstorm` CLI launcher on PATH.
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
        // Prerender every route reachable by crawling `<Link>`s from "/" (the gallery and sidebar
        // link to all component pages), shipping static HTML for SEO and CDN delivery. The built-in
        // sitemap is generated from those crawled pages into `public/sitemap.xml`.
        // `host` must match SITE_URL in `src/lib/seo.ts`.
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
        // Prerendered HTML is served by Vercel's filesystem layer, which bypasses the
        // server function — so a route's `headers()` never runs for it. routeRules is
        // the only hook the Vercel adapter writes into the deployment's header config,
        // so CDN cache headers for static output must live here. (`**` is the rou3
        // wildcard for nested paths; the preset emits it as a Vercel regex.) The
        // `.md`/`llms.txt` twins set their own Cache-Control in their handler.
        //
        // `/__tsr/staticServerFnCache/**` is the build-time output of static server
        // functions (the prerendered Shiki highlights). Vercel serves it with
        // `max-age=0, must-revalidate` by default; these files are keyed by function
        // id + params (not content), so they can't be `immutable`, but they share the
        // pages' freshness model — the client fetches them on navigation.
        routeRules: {
          "/": { headers: { "cache-control": CONTENT_CACHE_CONTROL } },
          "/about": { headers: { "cache-control": CONTENT_CACHE_CONTROL } },
          "/components": { headers: { "cache-control": CONTENT_CACHE_CONTROL } },
          "/components/**": { headers: { "cache-control": CONTENT_CACHE_CONTROL } },
          "/__tsr/staticServerFnCache/**": { headers: { "cache-control": CONTENT_CACHE_CONTROL } },
        },
        exportConditions: isDev ? ["source", "module"] : ["module"],
        // react@19 and use-sync-external-store are CJS-only, so the inlined shim keeps a runtime `require("react")`
        // that no export condition can turn into a static import. Trace react/react-dom so they end up in the
        // serverless function's node_modules; otherwise the deployed function throws "Cannot find module 'react'".
        traceDeps: ["react", "react-dom"],
      }),
      viteReact(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
  };
});
