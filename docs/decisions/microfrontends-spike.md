# Microfrontends for codefastlabs.com — spike record and decision

**Date:** 2026-09-02 · **Status:** settled — technically a go, **rejected on cost** (see §7) · **Branch:**
`spike/microfrontends` (throwaway, never merged)

Question the spike answers: can a TanStack Start + Nitro (`vercel` preset) app in this repo run as a **child
microfrontend** under Vercel Microfrontends, served under a path prefix, with the Turborepo/Vercel local proxy in
development? The portal plan (one shell app, `@codefast/ui` docs under `/ui`, package docs under `/docs`) depends on the
answer.

---

## 1. What was built

- `apps/web` — a minimal TanStack Start app, the **default** application. Owns `microfrontends.json`. Its landing page
  links to the child with plain `<a href="/ui/components">` (hard navigation: each app owns its own router).
- `apps/ui` — the existing docs site turned into a child: Vite `base: "/ui/"`, Nitro `baseURL: "/ui"`, dev script
  `vite dev --port $(turbo get-mfe-port)`.
- `@vercel/microfrontends@2.4.0` added to the catalog and to both apps. The package's Vite plugin was **not** used (see
  §3.2).
- `apps/web/microfrontends.json`: default app `codefast-web` (`packageName: "@apps/web"`, `development.local: 3000`,
  `fallback: "codefastlabs.com"`), child `codefast-ui-spike` (`packageName: "@apps/ui"`, `local: 3001`, routing
  `["/ui", "/ui/:path*"]`), `options.localProxyPort: 3024`.

## 2. Results

| Check                                                                                                              | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `turbo run dev --filter=@apps/web --filter=@apps/ui` starts the proxy without extra config                         | Yes. Turbo detects `microfrontends.json` + the package and adds a `@apps/web#proxy` task; proxy on 3024, ports 3000/3001 assigned automatically                                                                                                                                                                                                                                                                                                                                                                       |
| `http://localhost:3024/` served by `apps/web`, `/ui/components`, `/ui/components/button`, `/ui/about` by `apps/ui` | Yes, 200 each; the Button page renders fully through the proxy, no console errors                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/components/button` through the proxy                                                                             | 404 from the default app, as expected (the 308 redirects are P5 work)                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| TanStack Start derives `router.basepath` from Vite `base`                                                          | Yes (`deriveRouterBasepath` in `@tanstack/start-plugin-core` 1.171.39); no `router.basepath` was hand-set                                                                                                                                                                                                                                                                                                                                                                                                             |
| Server-function endpoint under the prefix                                                                          | Yes: the built SSR bundle carries `"/ui/_serverFn/"` (`createServerFnBasePath` joins router basepath + `serverFns.base`); in dev through the proxy the consent and highlight server functions answer 200 at `/ui/_serverFn/…`                                                                                                                                                                                                                                                                                         |
| Client asset URLs in built HTML                                                                                    | `/ui/assets/*.js`, `/ui/assets/*.css` — prefixed                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Prerender + `public/` output location with **only** Vite `base`                                                    | **Wrong**: files land at `static/index.html`, `static/about/index.html`, `static/assets/*` — TanStack strips the basepath from the output filename (`withoutBase` in `prerender.js`), expecting the host to mount the client dir at the base; Nitro ignores Vite `base`                                                                                                                                                                                                                                               |
| Same, with Nitro `baseURL: "/ui"` added                                                                            | **Correct**: everything under `static/ui/…` (`static/ui/index.html`, `static/ui/assets/*`, `static/ui/favicon.ico`, `static/ui/sitemap.xml`)                                                                                                                                                                                                                                                                                                                                                                          |
| `vite preview` of that build: `/ui/`, `/ui/about`, `/ui/components/button` (live render)                           | 200 each; `/components/button` → 307 to `/ui/…`; POST `/ui/_serverFn/…` reaches the handler (403 for an unknown id, not 404)                                                                                                                                                                                                                                                                                                                                                                                          |
| Child deployment on Vercel (`codefast-ui-spike`, prebuilt `.vercel/output`, Nitro `baseURL: "/ui"`)                | `/ui/`, `/ui/about`, `/ui/components/button`, `/ui/assets/*.js`, `/ui/assets/*.css`, `/ui/favicon.ico`, `/ui/sitemap.xml` all 200 from the child; the ISR page carries the route `Cache-Control` and is `x-vercel-cache: HIT` on the second request; `/components/button` and `/favicon.ico` 404 as expected; a bare GET to the consent server function answers 403 (handler reached, client headers missing), so the banner itself still needs a browser check                                                       |
| Group routing through the default app (`codefast-web.vercel.app`)                                                  | **Works**: `/` and `/robots.txt` come from `codefast-web`; `/ui/`, `/ui/components/button` (ISR, `x-vercel-cache: HIT`), `/ui/assets/*.js`, `/ui/favicon.ico` come from `codefast-ui-spike` (different `x-vercel-id`s and content); `/components/button` is a 404 from the default app. Both projects deployed prebuilt; `microfrontends.json` in `apps/web` is honored. Sending the `VERCEL_MFE_DEBUG=1` cookie without a toolbar session turns every response into a 302 to SSO, so the debug headers were not read |

## 3. Gaps found (each is fixable, none is a blocker)

### 3.1 Nitro's Vercel `config.json` ignores `baseURL`

`routeRules` become static-routing entries with **unprefixed** `src` (`/`, `/about`, `/assets/(.*)`) while the files now
live under `/ui/…`. Consequences on Vercel: the prerendered pages and `public/` files lose their `Cache-Control`, and
hashed assets lose `immutable`. Fix: write the rule keys with the prefix (`/ui`, `/ui/about`, `/ui/assets/**`) — the
keys are already generated in `vite.config.ts`, so prefixing them there is one join. Verify on the Preview deployment,
since `vite preview` does not replay Vercel routing.

### 3.2 `@vercel/microfrontends/experimental/vite` does not fit TanStack Start

Read from the installed source: for a non-default app it either sets `build.assetsDir` to `vc-ap-<md5 prefix>` (no
`basePath`) or, with `basePath`, sets `base` **and** `build.outDir = dist<basePath>` — the latter fights Nitro's output
layout, and the plugin only knows SvelteKit and React Router. Vite `base` + Nitro `baseURL` do the job without it. The
plugin's other outputs (`import.meta.env.MFE_CURRENT_APPLICATION`, `MFE_CONFIG`, dev `server.port`) are not needed here
because the proxy assigns ports through `microfrontends port`.

### 3.3 Hard-coded root-relative `public/` links

`__root.tsx` links `/favicon.ico`, `/logo192.png`, `/manifest.json`, and `og:image` is the absolute
`https://codefastlabs.com/og-image.png`. On Vercel those paths route to the **default** app. Fix: prefix with
`import.meta.env.BASE_URL` in the child, or move the site-wide files to `apps/web` (the P3/P4 plan already does the
latter for favicon, robots, OG image).

### 3.4 Sitemap and `llms.txt`

TanStack's `sitemap` writes `https://codefastlabs.com/components/...` (no `/ui`) into `static/ui/sitemap.xml`. Both
sitemap and `llms.txt` must be produced by the default app in the cutover (P5), so this is a confirmation rather than
new work.

### 3.5 Port injection: `$(turbo get-mfe-port)`, not `$TURBO_MFE_PORT`

With `@vercel/microfrontends` installed, Turbo defers to the Vercel proxy (`@apps/web#proxy` task) and **no longer
injects `TURBO_MFE_PORT`**: the Turborepo guide's Vite form `vite dev --port $TURBO_MFE_PORT` fails with
`CACError: option --port <port> value is missing`. The guide's Next.js form works unchanged, so both apps use
`vite dev --port $(turbo get-mfe-port)` — the command reads `microfrontends.json` and prints exactly `3000` / `3001` for
`@apps/web` / `@apps/ui`. Vercel's own `$(microfrontends port)` prints the same numbers (banner on stderr), so it is an
equivalent fallback, but the Turbo command keeps the scripts on the Turborepo-documented path.

### 3.6 Vercel pricing changes the app count

From the Vercel docs (2026-09-02): Hobby and Pro include **2 microfrontend projects**; each additional project on Pro is
**$250/month**; Hobby also caps routed requests at 50K/month; Enterprise is custom. A three-app portal (`web`, `ui`,
`docs`) is therefore either one paid project or out of reach on Hobby. The cheap shape is **two apps**: `web` absorbs
the markdown package docs (`/docs/*`), `ui` stays separate because it is the heavy, ISR-rendered one. This needs a
decision before P4.

## 4. Technical conclusion

TanStack Start + Nitro works as a path-prefixed child microfrontend once Vite `base` and Nitro `baseURL` are set
together; the local proxy needs no configuration beyond `microfrontends.json`, and Vercel routes the group correctly
(§2). The gaps in §3 are all one-line fixes. Nothing technical blocks the approach.

## 5. Vercel state

Done on 2026-09-02 in the personal scope `vuongphan` (the production project `codefastlabs` is untouched): projects
`codefast-web` and `codefast-ui-spike` (framework `tanstack-start`, prebuilt deploys with
`vercel deploy --prebuilt --prod` from each app directory), microfrontends group `codefast-spike` with `codefast-web` as
default and `/ui` as the child's default route, Vercel Authentication disabled on both. Aliases:
`codefast-web.vercel.app`, `codefast-ui-spike.vercel.app`. Verified there: `/` from the default app,
`/ui/components/button` and `/ui/assets/*` from the child (§2).

Teardown: `vercel microfrontends delete-group`, then `vercel project rm codefast-web` and
`vercel project rm codefast-ui-spike`.

## 6. Sources read

- Turborepo: `https://turborepo.dev/docs/guides/microfrontends.md`
- Vercel: `/docs/microfrontends`, `/quickstart`, `/configuration`, `/routing`, `/local-development`, `/troubleshooting`
- Installed code: `@vercel/microfrontends@2.4.0` (`dist/experimental/vite.js`), `@tanstack/start-plugin-core@1.171.39`
  (`planning.js`, `config-context.js`, `prerender.js`, `build-sitemap.js`), `nitro@3.0.260610-beta` (`_presets.mjs`,
  `_build/common.mjs`)

## 7. Decision (2026-09-02): no microfrontends on Vercel

**Rejected on cost, not on feasibility.** Vercel's pricing (§3.6) includes two microfrontend projects and bills each
additional one at $250/month on Pro, plus per-request routing fees; Hobby caps routed requests at 50K/month. For a
one-maintainer documentation site that is disproportionate to the benefit (independent deploys of a handful of docs
apps), and it would tie the site's shape to a vendor price list.

What this changes in the portal plan:

- **One app.** `apps/ui` stays the single TanStack Start deployment behind codefastlabs.com and grows into the portal: a
  landing page listing the packages, `/ui/*` for the `@codefast/ui` docs (the URL move and the `/components/*` →
  `/ui/components/*` 308 redirects stand, now as in-app redirects), `/docs/<pkg>/*` for the markdown docs of the other
  packages, one sitemap and one `llms.txt`. Prerender/ISR per route as today.
- **No shell package is needed** to share header, consent, and theme across apps; a shared layout inside the app is
  enough. `internal/` keeps its purpose for private packages that do appear (P1 stands).
- **Keep what the spike taught for later**: the Vite `base` + Nitro `baseURL` pairing and the `$(turbo get-mfe-port)`
  finding are the recipe if a second app ever becomes worth a Vercel project.

The spike branch `spike/microfrontends` is left unmerged as the working record; this document is the decision.
