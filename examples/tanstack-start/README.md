# @examples/tanstack-start

A [TanStack Start](https://tanstack.com/start) app that demonstrates the `@codefast/*` libraries
**as published on npm** — a smoke test for the real shipped artifacts. It's the TanStack Start
entry under `examples/*`; sibling examples cover other React frameworks.

## What makes this different from `apps/ui`

`apps/ui` (the docs site) consumes the packages through `workspace:*` links (their in-repo
source). This app instead depends on the **registry-published** versions, referenced through the
catalog so all examples share one pin:

```jsonc
// package.json
"@codefast/ui": "catalog:",
"@codefast/theme": "catalog:",
"@codefast/tailwind-variants": "catalog:",
"@codefast/di": "catalog:"
```

The catalog entries (in the root `pnpm-workspace.yaml`) pin the published versions, e.g.
`"@codefast/ui": ^0.4.0`. Two repo settings make pnpm fetch these from the registry rather than
linking the local `packages/*`:

- `.npmrc` → `link-workspace-packages=false`, so a non-`workspace:` spec (incl. `catalog:`)
  resolves from npm even when a matching workspace package exists.
- `catalogMode: manual`, so the catalog is not enforced repo-wide.

Because the `@codefast/*` deps go through the catalog, Changesets leaves them alone on release
(it doesn't rewrite `catalog:` specs or catalog entries) — so a canary version bump can't break
this app's install. To track a newer published release, bump the catalog entries by hand.

`vite.config.ts` deliberately omits the dev-only `source` resolve condition that `apps/ui`
uses, so what runs here is the packages' built `dist/`, not their `src/`.

It also adds `@rolldown/plugin-babel` with `@babel/plugin-proposal-decorators`: `@codefast/di` uses
TC39 Stage 3 decorators (`@injectable`, `@postConstruct`). Vite 8 bundles with Rolldown (oxc), whose
built-in decorator transform only covers _legacy_ (`experimentalDecorators`) decorators — not the
standard ones — so Babel lowers them.

## What it demos

| Route        | Package                       | Shows                                                                                                                                                                                                                                                      |
| ------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | overview                      | Which packages are installed and from where                                                                                                                                                                                                                |
| `/ui`        | `@codefast/ui`                | Buttons, badges, card, form field, switch, tabs                                                                                                                                                                                                            |
| `/ui` header | `@codefast/theme`             | SSR-safe light/dark/system toggle via server functions + cookie                                                                                                                                                                                            |
| `/variants`  | `@codefast/tailwind-variants` | A `Callout` component built from one typed `tv()` config                                                                                                                                                                                                   |
| `/di`        | `@codefast/di`                | Interactive task board: `@injectable` + modules wire the graph; each action is a server function that resolves a `scoped` service from a per-request child container, with singleton repository/log, `rebind`, `validate()`, and the live dependency graph |

## Develop

```bash
pnpm --filter @examples/tanstack-start dev      # http://localhost:3001
pnpm --filter @examples/tanstack-start build
pnpm --filter @examples/tanstack-start check-types
```
