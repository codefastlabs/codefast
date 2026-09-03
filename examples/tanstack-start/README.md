# @examples/tanstack-start

A [TanStack Start](https://tanstack.com/start) app that exercises the `@codefast/*` libraries the way a real consumer
does: against their **built `dist/`**, not their source. It is the consumer demo under `examples/*`.

## What makes this different from `apps/ui`

Both apps consume the packages through `workspace:*` links:

```jsonc
// package.json
"@codefast/di": "workspace:*",
"@codefast/tailwind-variants": "workspace:*",
"@codefast/theme": "workspace:*",
"@codefast/ui": "workspace:*"
```

The difference is which lane the link resolves to. `apps/ui` sets the dev-only `source` resolve condition, so in dev it
runs the packages' in-repo `src/`. This app's `vite.config.ts` sets no such condition, so the same `workspace:*` links
resolve to each package's built `dist/` — the exact artifact a published install runs. That makes it a smoke test of the
shipped output, catching build and export problems that source-mode `apps/ui` never sees.

`@codefast/di` uses TC39 standard decorators (`@injectable`, `@postConstruct`, `@preDestroy`), so the Vite config adds
`@rolldown/plugin-babel` with `@babel/plugin-proposal-decorators` (`version: "2023-11"`) to lower them, alongside the
React Compiler preset.

## What it demos

| Route         | Package                       | Shows                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`           | overview                      | Which packages are installed and where each demo lives                                                                                                                                                                                                                                                                                                                                               |
| `/ui`         | `@codefast/ui`                | Button variants, badges, composition, overlays, form controls, feedback, and toasts, imported per subpath (`@codefast/ui/button`)                                                                                                                                                                                                                                                                    |
| header toggle | `@codefast/theme`             | FOUC-free Light/Dark/Auto appearance via `AppearanceScript` + `AppearanceProvider`, persisted client-side in `localStorage`                                                                                                                                                                                                                                                                          |
| `/variants`   | `@codefast/tailwind-variants` | A `Callout` component built from one typed `tv()` config; its `tone` and `emphasis` props derive from that config via `VariantProps`                                                                                                                                                                                                                                                                 |
| `/di`         | `@codefast/di`                | A fullstack task board: `@injectable` classes and modules wire the graph; each server function resolves a `scoped` `TaskService` from a per-request child container and disposes it (`@preDestroy`), over a singleton repository and log, `injectAll` validators, and an `optional` metrics exporter. Shows the live dependency graph through every graph adapter plus a `container.inspect()` table |
| `/inspector`  | `@codefast/di`                | A resolution inspector: a multi-region SaaS request resolved on the server, listing for every slot the candidates the container weighed and the rule that settled it                                                                                                                                                                                                                                 |
| `/playground` | several                       | A small interactive app wiring `@codefast/ui` hooks and components, `@codefast/theme` for the active appearance, and the `tv()`-based `Callout` together                                                                                                                                                                                                                                             |

The task board's services are also under test with `@codefast/di-testing`:
`tests/unit/features/di/server/domain.test.ts` puts `TaskService` under `TestBed.solitary` — every collaborator
auto-mocked, seeded with `.stub`, with the `optional` dependency exercised both present and absent.

## Develop

Run `pnpm build:packages` first on a fresh clone — the app and its tests both consume the built `@codefast/*` `dist/`
(running them through Turbo builds it automatically).

```bash
pnpm --filter @examples/tanstack-start dev           # http://localhost:3001
pnpm --filter @examples/tanstack-start build
pnpm --filter @examples/tanstack-start preview       # serve the build output on :3001
pnpm --filter @examples/tanstack-start check-types
pnpm --filter @examples/tanstack-start test:unit
pnpm --filter @examples/tanstack-start test:coverage
```

## License

Released under the [MIT License](../../LICENSE).
