# @apps/ui

The [codefastlabs.com](https://codefastlabs.com) portal — a [TanStack Start](https://tanstack.com/start) app that
consumes the `@codefast/*` packages straight from the workspace. It serves the package landing, the documentation every
package ships as Markdown, and the `@codefast/ui` showcase with live previews and copy-ready source.

## What it serves

| Route                          | Page                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `/`                            | Landing page listing every published package, read from `packages/*/package.json`                           |
| `/docs`                        | Package index                                                                                               |
| `/docs/<pkg>`                  | A package's `README.md`, rendered                                                                           |
| `/docs/<pkg>/<doc>`            | The package's other documents: `spec`, `architecture`, `decisions`, `learning`, `contributing`, `changelog` |
| `/docs/<pkg>.md`, `…/<doc>.md` | Raw Markdown twin of each docs page, served as `text/markdown`                                              |
| `/ui`                          | The `@codefast/ui` landing page                                                                             |
| `/ui/components`               | Component gallery                                                                                           |
| `/ui/components/<slug>`        | One component: live examples, source, and docs                                                              |
| `/ui/components/<slug>.md`     | Markdown twin of a component page (production only — the dev server does not dispatch `.md` routes)         |
| `/ui/about`                    | Getting started with `@codefast/ui`                                                                         |
| `/privacy`                     | Privacy policy                                                                                              |
| `/llms.txt`                    | Machine-readable index of every package, document, and component, with links to the `.md` twins             |

`@codefast/ui` is the one package without a `/docs/<pkg>` page: its documentation is the `/ui` section, and a link to it
inside another package's Markdown is rewritten there. Route files live under `src/routes/`; the document kinds and their
URL segments are declared once in `src/features/package-docs/lib/doc-kinds.ts`.

## How package docs are rendered

Nothing is copied. `src/features/package-docs/lib/doc-source.impl.ts` reads `packages/*/package.json` and
`packages/*/*.md` through `import.meta.glob`, so editing a package's README changes its page on the next build.

`src/features/package-docs/lib/markdown/render.impl.ts` renders each document at build time with
[`marked`](https://marked.js.org) and highlights fenced code with [Shiki](https://shiki.style). Headings get
GitHub-style ids and the `##`/`###` outline becomes the page's table of contents. Relative links are rewritten by
`markdown/rewrite-link.ts`: a sibling document becomes its `/docs/<pkg>/<doc>` page, and any other repo path points at
GitHub, so the Markdown that reads well on GitHub also reads well on the site.

The `.md` twins are server routes (`src/routes/docs/{$pkg}[.]md.ts` and `docs/$pkg_/{$doc}[.]md.ts`) that return the
source Markdown unchanged.

Link-preview images are generated, not drawn by hand: `pnpm --filter @apps/ui generate:og` runs
`scripts/generate-og-image.ts`, which renders `public/og-image.png` for the site and one `public/og/<pkg>.png` per
package with resvg. Run it after adding or removing a component or package.

## Develop

Run `pnpm build:packages` once on a fresh clone. In dev the app resolves each `@codefast/*` package to its in-repo
`src/` through the `source` resolve condition, so a package edit shows here without a rebuild; a production `vite build`
drops that condition and runs the packages' built `dist/`, matching what a real consumer ships.

```bash
pnpm --filter @apps/ui dev            # http://localhost:3000
pnpm --filter @apps/ui build          # production build, against each package's dist/
pnpm --filter @apps/ui preview        # serve the build output from disk
pnpm --filter @apps/ui check-types    # tsc --noEmit
pnpm --filter @apps/ui generate:og    # regenerate the OG images
```

## Testing

Vitest runs a single **unit** project under jsdom that covers `tests/unit/**`, `tests/integration/**`, and
`tests/types/**`. The taxonomy is the repo's — see [`TESTING.md`](../../TESTING.md).

```bash
pnpm --filter @apps/ui test:unit          # tests/unit
pnpm --filter @apps/ui test:integration   # tests/integration
pnpm --filter @apps/ui test:type          # tests/types
pnpm --filter @apps/ui test:coverage      # V8 coverage for the unit project
pnpm --filter @apps/ui test:watch
```

## Analytics and consent

Google Analytics 4 is gated behind one environment variable. Set it in a local env file (`.env*` is gitignored); leave
it unset and the tag never loads:

```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

The site requests a single consent category, `analytics`, and runs no ads. The consent contract lives in
`src/features/tracking/lib/consent.ts` (`defineConsentConfig` from `@codefast/tracking`); the event catalog and tracker
in `src/features/tracking/lib/tracking.ts`.

### Per-visitor consent over a server function

The pages are prerendered or ISR-cached on Vercel, so the served HTML is shared across visitors and can carry nothing
region-specific. `<GoogleTag />` (`components/google-tag.tsx`) therefore bakes the strictest default into the inline
gtag bootstrap.

The region-correct value arrives per visitor on the one lane a shared cache cannot poison: after hydration,
`lib/visitor-consent.ts` calls the `resolveVisitorConsent` server function (`lib/resolve-visitor-consent.ts`), which
reads the request's geo header on the server and fails closed to the strictest default when it is absent. The result is
cached in `sessionStorage` for the session. `<ConsentGate />` (`components/consent-gate.tsx`) then renders the
region-correct UI from `@codefast/tracking/react`: an opt-in banner plus a settings reopen link for EU/VN, and a
persistent analytics opt-out toggle for US/other. There is no edge middleware and no consent cookie set by the server;
the trade is one round trip before the consent UI appears.

### Browser storage naming

Every first-party storage name (cookie, `localStorage`, `sessionStorage`) follows `codefast-ui-<content>`: the prefix
namespaces the shared origin, and `<content>` is a kebab-case noun naming exactly what is stored — never the storage
kind, and never less than the content. The names in use are `codefast-ui-consent` (the decision),
`codefast-ui-initial-consent` (the resolved region default, in `sessionStorage`), and `codefast-ui-anon-id` (the
anonymous-id cookie). `@codefast/tracking` ships no storage names — every one is supplied by the app.

## Deployment

The app deploys to Vercel through Nitro's `vercel` preset (`vite.config.ts`). Rendering is split per route, because a
prerendered file and a server function are mutually exclusive on Vercel:

- **Prerendered at build time** — the entry pages (`/`, `/docs`, `/privacy`, `/ui`, `/ui/about`, `/ui/components`) via
  `autoStaticPathsDiscovery`, plus every `/docs/<pkg>[/<doc>]` page, listed from the Markdown under `packages/*`.
  `crawlLinks` stays off so the gallery never drags the component pages into the static set.
- **ISR** — each `/ui/components/<slug>` page is server-rendered on demand and CDN-cached under its route's `headers()`
  (`Cache-Control` + `CDN-Cache-Control`, from `src/lib/cache.ts`).

Static files bypass the server, so their cache headers come from Nitro `routeRules`, which Vercel bakes into its static
routing. The same block carries the permanent redirects for the `@codefast/ui` section's former URLs:

| From             | To                  | Status |
| ---------------- | ------------------- | ------ |
| `/components`    | `/ui/components`    | 308    |
| `/components/**` | `/ui/components/**` | 308    |
| `/about`         | `/ui/about`         | 308    |

`vite preview` serves the build output from disk and replays none of this routing. To check deployed headers locally,
run `vercel link` once and then `vercel dev`.

## License

Released under the [MIT License](../../LICENSE).
