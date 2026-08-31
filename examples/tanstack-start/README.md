# @examples/tanstack-start

A [TanStack Start](https://tanstack.com/start) app that exercises the `@codefast/*` libraries the way a real consumer
does — against their **built `dist/`**, not their source. It's the TanStack Start entry under `examples/*`; sibling
examples cover other React frameworks.

## What makes this different from `apps/ui`

Both consume the packages through `workspace:*` links:

```jsonc
// package.json
"@codefast/ui": "workspace:*",
"@codefast/theme": "workspace:*",
"@codefast/tailwind-variants": "workspace:*",
"@codefast/di": "workspace:*"
```

The difference is which lane the link resolves to. `apps/ui` (the docs site) sets the dev-only `source` resolve
condition, so it runs the packages' in-repo `src/`. This app's `vite.config.ts` deliberately omits that condition, so
the same `workspace:*` links resolve to each package's built `dist/` — the exact artifact a published install would run.
That makes it a smoke test of the shipped output, catching build/export problems that source-mode `apps/ui` never sees.

It also adds `@rolldown/plugin-babel` with `@babel/plugin-proposal-decorators`: `@codefast/di` uses TC39 Stage 3
decorators (`@injectable`, `@postConstruct`). Vite 8 bundles with Rolldown (oxc), whose built-in decorator transform
only covers _legacy_ (`experimentalDecorators`) decorators — not the standard ones — so Babel lowers them.

## What it demos

| Route        | Package                       | Shows                                                                                                                                                                                                                                                      |
| ------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | overview                      | Which packages are installed and from where                                                                                                                                                                                                                |
| `/ui`        | `@codefast/ui`                | Buttons, badges, card, form field, switch, tabs                                                                                                                                                                                                            |
| `/ui` header | `@codefast/theme`             | FOUC-free light/dark/system toggle, persisted client-side in `localStorage`                                                                                                                                                                                |
| `/variants`  | `@codefast/tailwind-variants` | A `Callout` component built from one typed `tv()` config                                                                                                                                                                                                   |
| `/di`        | `@codefast/di`                | Interactive task board: `@injectable` + modules wire the graph; each action is a server function that resolves a `scoped` service from a per-request child container, with singleton repository/log, `rebind`, `validate()`, and the live dependency graph |

The task board's services are also under test with `@codefast/di-testing`: `tests/unit/**` puts them under
`TestBed.solitary` — every collaborator auto-mocked, with `.impl` stubs, an `injectAll` slot, the `optional` dependency
exercised both bound and absent, and `@preDestroy` on dispose.

## Develop

Run `pnpm build:packages` first on a fresh clone — like the app itself, the tests consume the built `@codefast/*` dist
(running them through turbo builds it automatically).

```bash
pnpm --filter @examples/tanstack-start dev      # http://localhost:3001
pnpm --filter @examples/tanstack-start build
pnpm --filter @examples/tanstack-start check-types
pnpm --filter @examples/tanstack-start test:unit
```
