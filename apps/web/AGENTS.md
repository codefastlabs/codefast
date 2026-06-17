<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

---

# @apps/web — Project Context

## Scaffold Commands

```
# Step 1 — scaffold (run from apps/) — originally created as `web`
npx @tanstack/cli@latest create web --agent

# Step 2 — wire TanStack Intent into AGENTS.md
npx @tanstack/intent@latest install

# Step 3 — list available skills
npx @tanstack/intent@latest list
```

## Stack

| Concern         | Choice                                                        |
| --------------- | ------------------------------------------------------------- |
| Framework       | TanStack Start (SSR/SPA meta-framework over TanStack Router)  |
| Routing         | TanStack Router (file-based, `src/routes/`)                   |
| React           | React 19                                                      |
| UI library      | `@codefast/ui` (Radix-based, subpath imports)                 |
| Theme           | `@codefast/theme` (SSR color scheme + cookie persistence)     |
| Styling         | Tailwind CSS v4 (via `@tailwindcss/vite` plugin)              |
| Bundler         | Vite 8                                                        |
| Package manager | **pnpm** (workspace catalog — see root `pnpm-workspace.yaml`) |
| Language        | TypeScript (strict mode, `bundler` module resolution)         |
| Testing         | Vitest + @testing-library/react                               |
| Devtools        | TanStack Devtools + Router Devtools panel                     |

## Package Manager

This app lives inside the `codefastlabs/codefast` pnpm monorepo at `apps/web`.

- **Always install via the workspace root**: `pnpm install --filter web` or just `pnpm install` from the root.
- **Do not use npm or yarn** — they will create a nested `node_modules` that conflicts with the workspace.
- Direct version overrides (not in catalog) are listed explicitly in `package.json`; everything else uses `"catalog:"`.
- `@tailwindcss/typography` and `@tanstack/router-plugin` are not in the workspace catalog and carry pinned versions in `package.json`.

## Dev Server

```
# From repo root
pnpm --filter web dev      # starts on http://localhost:3000

# From app directory
pnpm dev
```

## Build & Preview

```
pnpm build
pnpm preview
```

## File Structure

```
src/
  routes/
    __root.tsx              # Root layout: <html>, <head>, Header, Footer, devtools
    index.tsx               # / route (thin — composes home/ components)
    about/
      route.tsx             # /about (Getting Started)
    components/
      index.tsx             # /components (component gallery)
      $slug.tsx             # /components/$slug (detail page)
  components/
    home/                   # Marketing page sections (hero, features, stats, CTA)
    about/                  # Getting Started page sections
    layout/                 # Header, Footer, CommandPalette, AppearanceToggle
      nav-links.ts          # Shared PRIMARY_NAV / RESOURCE_LINKS / GITHUB_URL
    showcase/               # Gallery /components (hero, layout, cards, A–Z nav)
      gallery-hero-section.tsx
      gallery-layout.tsx
      gallery-cta-section.tsx
      showcase-data.ts
      groups.ts
      group-section.tsx
      component-card.tsx
      component-card-meta.tsx
      preview-card.tsx
      preview-skeleton.tsx
      import-path-label.tsx
      command-palette-hint.tsx
      lazy-visible.tsx
      lazy-code-block.tsx
      sidebar-nav.tsx
      mobile-nav.tsx
      use-active-section.ts # Gallery scroll-spy wrapper
    detail/                 # Component detail /components/$slug
      detail-page.tsx       # Route orchestration (hero + Suspense body + hash scroll)
      detail-hero-section.tsx
      detail-install-panel.tsx
      detail-mobile-toc.tsx
      detail-cta-section.tsx
      detail-skeleton.tsx
      detail-not-found.tsx
      detail-body.tsx       # Per-slug lazy body + DETAIL_BODY_BY_SLUG
      on-this-page.tsx      # Desktop TOC (scroll-spy)
      doc-section.tsx
      examples-section.tsx
      example-preview.tsx
      api-section.tsx
      props-table.tsx
      accessibility-section.tsx
      keyboard-table.tsx
      guidelines-section.tsx
      anatomy-section.tsx
      related-section.tsx
      component-pager.tsx
      language-selector.tsx
    shared/                 # Cross-cutting: CodeBlock, NotFound, PageHeader, PreviewTabs, SectionHeader, CopySnippet
  hooks/
    use-hash-scroll.ts      # URL hash → scrollIntoView (gallery + detail anchors)
    use-active-anchor.ts    # Scroll-spy (gallery letter bands + detail TOC)
    use-preload-detail.ts   # Debounced preloadDetail on hover/focus
  lib/
    highlight.ts            # HighlightedSource type
    install.ts              # Install command + CSS setup snippets
    layout.ts               # Scroll offset constants
  registry/                 # Component catalog (65 slugs) — see Registry Conventions
  router.tsx                # createRouter() factory + Register type declaration
  styles.css                # Global Tailwind + site semantic tokens (--ui-*)
  routeTree.gen.ts          # Auto-generated by router-plugin — do not edit manually
vite.config.ts              # Plugin order: devtools → tailwindcss → tanstackStart → viteReact
tsconfig.json
```

## Route Conventions

- File-based routing via `@tanstack/router-plugin` — files under `src/routes/` become routes automatically.
- **Folder-per-segment** — every URL segment is a directory under `src/routes/`. No flat route files like `about.tsx`.
- Only two files may sit directly under `src/routes/`: `__root.tsx` (document shell) and `index.tsx` (home `/`).
- **Single-page segment** → `{segment}/route.tsx` with `createFileRoute('/{segment}')`.
- **Segment with child routes** → `{segment}/index.tsx` (index) + `{segment}/$param.tsx` (dynamic), etc. No `route.tsx` unless you need a shared layout wrapping children (`<Outlet />`).
- `__root.tsx` exports `Route = createRootRoute({ ... })` with a `shellComponent` (the full HTML document shell).
- The plugin sets `createFileRoute(...)` path strings — do not edit them by hand.
- Pathless layout routes: prefix folder or file with `_` (underscore = no URL segment).
- Non-route helpers in `src/routes/`: prefix filename with `-` (ignored by the plugin).
- `routeTree.gen.ts` is regenerated on every `vite dev` / `vite build` run — never edit it by hand.
- **Routes stay thin** — compose page UI from `components/`; static data lives in colocated `*-data.ts` files.

## Component Organization

| Folder      | Purpose                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| `home/`     | Marketing `/` page sections                                                  |
| `about/`    | Getting Started `/about` page sections                                       |
| `layout/`   | Site chrome (header, footer, theme toggle, ⌘K)                               |
| `showcase/` | `/components` gallery — tabbed cards, lazy demos, A–Z nav, preload on hover  |
| `detail/`   | `/components/$slug` — hero, install panel, lazy doc body, mobile/desktop TOC |
| `shared/`   | Primitives reused ≥2 times (NotFound, PreviewTabs…)                          |

Import `@codefast/ui` via subpath exports (`@codefast/ui/button`). Use `cn()` from `@codefast/ui/lib/utils`.

## Registry Conventions

The `registry/` folder holds the component catalog (~65 slugs). **Do not refactor demo content** unless explicitly requested.

Each slug folder follows:

```
registry/<slug>/
  meta.ts          # Display metadata (eager glob in components.ts)
  demo.tsx         # Showcase card demo (lazy glob in demos.ts)
  doc.ts           # Rich documentation (lazy glob in docs.ts)
  anatomy.txt      # Composition skeleton
  *.example.tsx    # Doc examples
```

Auto-discovery via Vite `import.meta.glob` — no hand-maintained component lists.

## Path Aliases

Both `#/*` and `@/*` resolve to `src/*` (defined in `tsconfig.json` and `package.json#imports`).

## Theme

Light/dark/system color scheme is handled by `@codefast/theme`:

- `AppearanceScript` in `__root.tsx` prevents flash-of-wrong-theme before hydration
- `AppearanceProvider` wraps the app shell
- Server functions from `@codefast/theme/start` persist preference via cookie

Do not add a separate theme library unless intentional.

## Styling

- Site semantic tokens: `bg-ui-bg`, `text-ui-fg`, `text-ui-muted`, `border-ui-border/60`, `text-ui-brand`
- Theme CSS: `@codefast/ui/css/themes/sky.css` + `preset.css` in `styles.css`
- Page entrance animation: `@utility page-enter` (and `page-enter-delayed` for a staggered child) in `styles.css`
- Scroll offsets: `STICKY_OFFSET_*`, `SCROLL_MT_GALLERY`, `SCROLL_MT_ANCHOR` from `lib/layout.ts`

## Naming & Branding

The library name has two distinct forms — never mix them:

- **Wordmark / display** — `codefast/ui` (no `@`). Use for the header logo, page `<title>`s, `SITE_NAME`/`SITE_TITLE`, section eyebrows, and any purely human-facing label. The `@` scope prefix reads as noise in a logo.
- **Package identity** — `@codefast/ui` (with `@`). Use anywhere the name is meant to be typed or copied: install commands (`pnpm add @codefast/ui`), import paths (`@codefast/ui/<slug>`), npm links, and the logo's `aria-label` (so screen readers announce the exact package name).

Rule of thumb: if the visitor would **copy or run** it, keep the `@`; if it's just a **label**, drop it. Demo fixtures (e.g. `hero-card`, `separator`) may use either form as sample content — those are not brand references.

## Environment Variables

No environment variables are required for the default app. When adding them:

- Prefix browser-accessible variables with `VITE_` (they are inlined at build time).
- Server-only variables (no prefix) are accessible in server functions (`createServerFn`).
- Do not commit `.env` files; document new vars here.

## Deployment

The app uses TanStack Start's SSR mode by default (Vite builds a Node-compatible server bundle). Deployment targets supported by `@tanstack/start-client-core`:

- **Node.js / Docker**: default output, run with `node dist/server.js`
- **Cloudflare Workers**: load `start-core/deployment` skill before adding adapter
- **Netlify / Vercel**: load `start-core/deployment` skill before adding adapter
- **SPA mode**: configurable per-route via `ssr: false` on the route or globally

No adapter is configured yet — the app is in default Node SSR mode.

## Key Architectural Decisions

1. **Docs site, not a general app** — registry-driven auto-discovery with aggressive code-splitting (per-demo, per-doc, per-slug detail body).
2. **TanStack Router over React Router** — all navigation must use `<Link>`, `useNavigate`, and the router's search-param validation. Do not use `window.location` directly.
3. **Server functions over API routes** — prefer `createServerFn` for data mutations and fetches; use server routes (`route.server`) only for REST-compatible external integrations.
4. **Type safety is non-negotiable** — never cast `as any` on router types. Use `getRouteApi()` in code-split files, `from` narrowing on hooks.
5. **Vite plugin order matters** — `devtools()` must be first in the plugins array (requirement of `@tanstack/devtools-vite`).
6. **Shared primitives** — `NotFound`, `PageHeader`, `PreviewTabs` live in `components/shared/`; one implementation per UX pattern.

## Known Gotchas

- `routeTree.gen.ts` is missing until the first `vite dev` or `vite build` run. TypeScript will error on fresh clone until you start the dev server.
- The nested `.git` directory created by `npx @tanstack/cli create` has been removed — this app is tracked by the monorepo root git.
- The CLI installed with npm; dependencies were re-installed with pnpm to align with the workspace.
- `@tanstack/router-plugin` version is pinned directly in `package.json` (not in workspace catalog).
- Composition recipes (`date-picker`, `data-table`, `typography`) have no single `@codefast/ui/<slug>` export — `meta.composition` drives alternate UI labels.
- **Devtools are auto-stripped in production by `@tanstack/devtools-vite`** — render `<TanStackDevtools>` unconditionally in `__root.tsx`. Do NOT wrap it in `import.meta.env.DEV`; the plugin removes the inner JSX at build time and a guard leaves invalid syntax that breaks the build.
- **SEO prerender + sitemap** (`vite.config.ts` → `tanstackStart({ prerender, sitemap })`): `crawlLinks` discovers pages by following internal `<a href="/…">` from `/`, so every internal link — including ones in registry demos — must point to a real route, or the prerender fails. Keep demo links real (no `/docs`-style placeholders). The sitemap host must stay in sync with `SITE_URL` in `src/lib/seo.ts`.
