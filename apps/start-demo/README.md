# @apps/start-demo

A [TanStack Start](https://tanstack.com/start) app that demonstrates the `@codefast/*` libraries
**as published on npm** — a smoke test for the real shipped artifacts.

## What makes this different from `apps/web`

`apps/web` consumes the packages through `workspace:*` links (their in-repo source). This app
instead depends on the **registry-published** versions:

```jsonc
// package.json
"@codefast/ui": "0.4.0",
"@codefast/theme": "0.4.0",
"@codefast/tailwind-variants": "0.4.0",
"@codefast/di": "0.4.0"
```

To make pnpm actually fetch these from the registry instead of linking the local
`packages/*`, two repo-wide settings were relaxed (both approved as part of this demo):

- `pnpm-workspace.yaml` → `catalogMode: manual` (was `strict`), so an in-workspace app may pin
  real version ranges.
- `.npmrc` → `link-workspace-packages=false`, so a non-`workspace:` spec resolves from npm.
  Existing packages keep using `workspace:*`, which always links regardless.

`vite.config.ts` deliberately omits the dev-only `source` resolve condition that `apps/web`
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
pnpm --filter @apps/start-demo dev      # http://localhost:3001
pnpm --filter @apps/start-demo build
pnpm --filter @apps/start-demo check-types
```
