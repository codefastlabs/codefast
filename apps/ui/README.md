# @apps/ui

The site behind [codefastlabs.com](https://codefastlabs.com) — a [TanStack Start](https://tanstack.com/start) app that
consumes the `@codefast/*` packages straight from the workspace. It serves three things:

- `/` — a landing page listing every published package, built from `packages/*/package.json` at build time.
- `/ui/components/*` — the `@codefast/ui` showcase: live previews and copy-ready source for every component.
- `/docs/<pkg>[/<kind>]` — the other packages' documentation, rendered at build time from the markdown they ship
  (`README.md`, `SPEC.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `LEARNING.md`, `CHANGELOG.md`; see
  `src/features/package-docs/lib/doc-kinds.ts`). Relative links are rewritten to the site or to GitHub, headings get
  GitHub-style ids, and every page has a raw Markdown twin (`/docs/<pkg>.md`, `/docs/<pkg>/<kind>.md`). Nothing is
  copied: the pages read the files through `import.meta.glob`, so editing a package's README changes its page on the
  next build.

In dev (`vite dev`) it resolves each package to its in-repo `src/` via the `source` resolve condition, so a package edit
shows here without a rebuild; a production `vite build` drops that condition and runs the packages' built `dist/`,
matching what a real consumer ships. It deploys to Vercel as ISR/prerender.

## Develop

```bash
pnpm --filter @apps/ui dev     # http://localhost:3000
pnpm --filter @apps/ui build   # production build (runs against each package's dist/)
```

## Testing

Vitest runs a single **unit** project (`tests/unit/**`, `tests/integration/**`, `tests/types/**` under jsdom). Taxonomy
details live in the repo root [`TESTING.md`](../../TESTING.md).

```bash
pnpm --filter @apps/ui test:unit          # unit + jsdom
pnpm --filter @apps/ui test:integration   # integration
pnpm --filter @apps/ui test:coverage      # V8 coverage for the unit project only
```

## Analytics

GA4 (`src/features/tracking/lib/tracking.ts`, `src/features/tracking/components/google-tag.tsx`) is gated behind an env
var — set it in `.env.local` (gitignored) to enable it; leave it unset and it stays fully inert (no script loads, no
gtag calls):

```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

- `VITE_GA4_MEASUREMENT_ID` — GA4 property → Admin → Data Streams → Web stream → "Measurement ID".

Google Ads conversion tracking was built (`createGoogleAdsConversionDestination` in `@codefast/tracking`) and then
deliberately not adopted for this app — removed rather than left wired but unused.

## Consent

Region (`x-vercel-ip-country`) and GPC (`Sec-GPC`) are resolved per visitor by a server function
(`src/features/tracking/lib/resolve-visitor-consent.ts` → `buildInitialConsent` from `@codefast/tracking/server`) and
drive both:

- The Consent Mode v2 state in `src/features/tracking/components/google-tag.tsx` / `consent-gate.tsx` (denied for EU/VN
  opt-in regions, analytics granted for US/other — GPC is ads-only).
- The consent UI in `src/features/tracking/components/consent-gate.tsx` — a blocking accept/reject banner for opt-in
  regions, an always-visible "Turn on/off analytics" toggle for opt-out regions (this site sells or shares no personal
  data, so the control is named by what it does). Both come from `@codefast/tracking/react`, styled here via
  `className`.

### Browser storage naming

Every first-party storage name (cookie, `localStorage`, `sessionStorage`) follows `codefast-ui-<content>`: the prefix
namespaces the shared origin, `<content>` is a kebab-case noun naming exactly what is stored — never the storage kind
(the privacy page discloses that) and never less than the content (`codefast-ui-initial-consent` holds a full
`InitialConsent`, so it is not called `-region`). `codefast-ui-anon-id` predates the full-word rule and stays: renaming
a year-lived cookie would churn every existing visitor's identity for a cosmetic gain. `@codefast/tracking` ships no
storage names — every cookie and key name is supplied by the app.

### This app's pages are CDN-cached (ISR) — the HTML can't be personalized

The entry pages (`/`, `/docs`, `/privacy`, `/ui`, `/ui/about`, `/ui/components`) are prerendered at build time; every
`/ui/components/$slug` page is server-rendered on demand and cached by the CDN under its route's `headers()` policy
(`Cache-Control` + `CDN-Cache-Control`, see `src/lib/cache.ts` — TanStack Start's hybrid ISR pattern). Either way the
served HTML is shared across visitors, so the inline gtag bootstrap in `google-tag.tsx` bakes the strictest possible
default (`denied`, `opt-in`, region `other`) — a request-derived value (geo in `loaderData`, the document shell, or
otherwise) would leak the first visitor's region to everyone served from that cache entry. Start does run route loaders
before SSR render; the constraint is cache sharing, not shell-vs-loader timing.

The per-visitor correction runs on the one lane a shared cache can't poison: after hydration, `visitor-consent.ts` calls
the `resolveVisitorConsent` server function once per session (`private, no-store`; cached in `sessionStorage` as
`codefast-ui-initial-consent`), and `<ConsentGate />` renders the region-correct UI and pushes the granted regional
default to gtag for undecided opt-out visitors. The resolver reads the geo header on the server, reuses
`buildInitialConsent` directly — no duplicated country sets — and fails closed to the strictest default when the header
is absent (a host without geo), when the request fails, or before it resolves. There is no edge middleware, no consent
cookie, and no `window.__INITIAL_CONSENT__`; the trade is one round trip before the consent UI appears (and before an
undecided US visitor's first hits upgrade from cookieless pings to full measurement).

## Built with TanStack Start

Routing, server functions, and API routes follow standard [TanStack Start](https://tanstack.com/start) conventions — see
its docs for the framework primitives. Styling is [Tailwind CSS](https://tailwindcss.com/) v4 via `@codefast/ui`'s
preset (`src/styles.css`).
