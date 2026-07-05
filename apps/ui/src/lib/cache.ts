/**
 * The `Cache-Control` policy for content that changes only on redeploy: docs pages, their
 * text twins, and the unhashed `public/` files (favicon, logos, OG image).
 *
 * Balances a modest browser `max-age` against a longer CDN `s-maxage` and a week of
 * `stale-while-revalidate`, so the edge absorbs load and answers instantly while a redeploy
 * still reaches clients within the hour. Never applied as `immutable` — none of this content
 * carries a hash in its URL, so a same-URL content change must still be able to invalidate it.
 *
 * Three call sites apply it, because no single mechanism reaches every request path:
 * - Page routes (`/`, `/about`, `/components`, `/components/$slug`) set it through TanStack
 *   Start's `headers()` route option, the framework's own mechanism for response headers.
 *   It only takes effect for a live render — dev, or any route excluded from prerendering.
 *   Once a route is prerendered for Vercel, its `Response` headers never reach
 *   `.vercel/output/config.json`; Nitro's prerender crawler renders through the same handler
 *   but persists only the HTML body. `headers()` stays in place regardless, as the canonical
 *   declaration of intent for every route that reads it.
 * - Prerendered pages and `public/` files instead get this header from Nitro `routeRules` in
 *   `vite.config.ts`, which Vercel bakes into `config.json`'s static routing — the only path
 *   that reaches a prerendered file's deployed headers.
 * - The `.md` / `llms.txt` twins are Vercel Functions, never prerendered, so they set this
 *   directly on their `Response`. Pair it with `CONTENT_CDN_CACHE_CONTROL`, or Vercel strips
 *   `s-maxage`/`stale-while-revalidate` before the header reaches the browser.
 *
 * Hashed `/assets/*` use a separate `immutable`, one-year policy applied automatically by the
 * Vercel adapter — safe there because a content change always produces a new URL.
 *
 * `vite preview` doesn't reflect any of this: it serves `.vercel/output/static` straight off
 * disk and never reads `config.json`'s routing rules, so prerendered pages and `public/` files
 * come back with no `Cache-Control` at all when tested that way. To verify these headers
 * locally, run `vercel link` once, then `vercel dev` — it replays Vercel's actual routing.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/isr
 */
export const CONTENT_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * The companion `CDN-Cache-Control` policy for the server-function routes (`llms.txt`, `*.md`).
 *
 * Preserves the CDN and stale-while-revalidate directives that Vercel otherwise strips from a
 * Function response's `Cache-Control` before forwarding it to the browser — a behavior that
 * applies only to Function responses, not to headers set through `routeRules`. Uses the
 * IETF-standard `CDN-Cache-Control` rather than a Vercel-specific header, so the same directive
 * would still be honored by another CDN.
 *
 * @see https://vercel.com/docs/caching/cdn-cache#cdn-cache-control
 */
export const CONTENT_CDN_CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

/**
 * The page and system path patterns that receive `CONTENT_CACHE_CONTROL` through Nitro
 * `routeRules` in `vite.config.ts`.
 *
 * Curated by hand, since each entry is a structural route decision rather than a filesystem
 * fact — unlike the `public/` directory, which `publicCacheRoutePatterns` in `vite.config.ts`
 * scans automatically so a new favicon, logo, or OG image needs no change here.
 *
 * Excludes `robots.txt` and `sitemap.xml` (the latter never lives in `public/`), so a crawler
 * always sees the current version of either.
 */
export const CACHED_ROUTE_PATTERNS = ["/", "/about", "/components", "/components/**", "/__tsr/staticServerFnCache/**"];
