/**
 * The `Cache-Control` policy for content that changes only on redeploy: docs pages, their
 * text twins, and the unhashed `public/` files (favicon, logos, OG image).
 *
 * Balances a modest browser `max-age` against a longer CDN `s-maxage` and a week of
 * `stale-while-revalidate` — the ISR policy (TanStack Start style): pages render on demand,
 * the CDN serves them for a day and revalidates stale copies in the background, so the edge
 * absorbs load while a redeploy still reaches clients within the hour. Never applied as
 * `immutable` — none of this content carries a hash in its URL, so a same-URL content change
 * must still be able to invalidate it.
 *
 * Two call sites apply it, because no single mechanism reaches every request path:
 * - Live-rendered responses — page routes via TanStack Start's `headers()` route option,
 *   the `.md` / `llms.txt` twins and the highlight server fn directly on their `Response`.
 *   All must pair it with `CONTENT_CDN_CACHE_CONTROL`, or Vercel strips
 *   `s-maxage`/`stale-while-revalidate` from a Function response before it reaches the CDN.
 * - The `public/` files get it from Nitro `routeRules` in `vite.config.ts`, which Vercel
 *   bakes into `config.json`'s static routing — the only path to a static file's deployed
 *   headers.
 *
 * Hashed `/assets/*` use a separate `immutable`, one-year policy applied automatically by the
 * Vercel adapter — safe there because a content change always produces a new URL.
 *
 * `vite preview` doesn't reflect any of this: it serves the build output straight off disk
 * and never replays Vercel's routing. To verify these headers locally, run `vercel link`
 * once, then `vercel dev` — it replays Vercel's actual routing.
 *
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/isr
 */
export const CONTENT_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * The companion `CDN-Cache-Control` policy for every live-rendered response (pages, `llms.txt`,
 * `*.md`, the highlight server fn).
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

/** The two content-cache headers together — the full policy for a live-rendered response. */
export const CONTENT_CACHE_HEADERS = {
  "Cache-Control": CONTENT_CACHE_CONTROL,
  "CDN-Cache-Control": CONTENT_CDN_CACHE_CONTROL,
} as const;
