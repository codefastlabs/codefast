/**
 * The single `Cache-Control` policy for the docs site's content. Every page and
 * text twin is regenerated only on redeploy, so the strategy is "cache hard at
 * the edge, revalidate in the background": a modest browser `max-age` keeps
 * clients close to fresh while `s-maxage` + `stale-while-revalidate` let the CDN
 * absorb load and answer instantly, serving stale for a week while it refetches.
 *
 * Applied through two mechanisms because prerendered HTML and function responses
 * take different paths on Vercel:
 * - Prerendered pages are served by the filesystem layer (the route's `headers()`
 *   never runs), so their headers come from Nitro `routeRules` in `vite.config.ts`.
 * - The `.md` / `llms.txt` twins are rendered by the server function, which sets
 *   this on its `Response` directly.
 *
 * Hashed `/assets/*` are cached separately (immutable, 1y) by the Vercel adapter.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/isr
 */
export const CONTENT_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
