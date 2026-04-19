# @codefast/di — Examples

These scripts are **runnable end-to-end demos**. They are grouped so you can see which **real problems** `@codefast/di` solves (not just API surface): type-safe wiring, request/tenant isolation, async infrastructure, plugin hosts, and safe shutdown.

If you only read one “full picture” file after the basics, pick **[07-real-world-web-app.ts](./07-real-world-web-app.ts)** (HTTP-shaped flow) or **[12-production-microservice.ts](./12-production-microservice.ts)** (long-lived service bootstrap).

---

## What the examples demonstrate (at a glance)

| You want to…                                                                             | See                                                                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Wire dependencies with **tokens** and **singleton vs transient**                         | [01](./01-basic-tokens.ts), [02](./02-decorators.ts)                                                    |
| Isolate **per-request** or **per-tenant** state without passing context everywhere       | [03](./03-scopes-and-child-containers.ts), [07](./07-real-world-web-app.ts), [11](./11-multi-tenant.ts) |
| Split registrations into **modules**, dedupe diamond imports, **load/unload** at runtime | [04](./04-modules.ts), [10](./10-plugin-architecture.ts)                                                |
| **Async** factories, **activation/deactivation**, **dispose**, parallel singleton init   | [05](./05-async-lifecycle.ts), [12](./12-production-microservice.ts)                                    |
| **Named / tagged** bindings, **parent constraints**, **pipelines** via `resolveAll`      | [06](./06-constraints-multi-binding.ts), [07](./07-real-world-web-app.ts)                               |
| **Aliases**, **toResolved**, **rebind**, surgical **unbind** in multi-bindings           | [08](./08-advanced-bindings.ts)                                                                         |
| **Predictable errors** and **scope validation** (captive singleton → scoped)             | [09](./09-error-handling.ts), [07](./07-real-world-web-app.ts), [12](./12-production-microservice.ts)   |
| **Plugin** architecture: module “last wins” vs container **append**, hot-swap            | [10](./10-plugin-architecture.ts)                                                                       |
| **Production-style** graph: config → DB → Redis → worker → health → HTTP                 | [12](./12-production-microservice.ts)                                                                   |

---

## Suggested reading order

1. **Core mechanics** — [01](./01-basic-tokens.ts) → [02](./02-decorators.ts): tokens, bindings, `@injectable` / `optional()`.
2. **Scopes** — [03](./03-scopes-and-child-containers.ts): singleton / transient / scoped + `createChild()`.
3. **Modules** — [04](./04-modules.ts): composition, dedup, `inspect()`, dynamic load.
4. **Async & lifecycle** — [05](./05-async-lifecycle.ts): `AsyncModule`, `toDynamicAsync`, hooks, `await using`.
5. **Selection & lists** — [06](./06-constraints-multi-binding.ts): names, tags, `whenParentIs`, `resolveAll`.
6. **Integrated web-style app** — [07](./07-real-world-web-app.ts): middleware chain, `validate`, shutdown.
7. **Binding ergonomics** — [08](./08-advanced-bindings.ts): `toResolved`, `toAlias`, `rebind`, `.id()`.
8. **Failure modes** — [09](./09-error-handling.ts): when things throw and how to fix them.
9. **Larger systems** — [10](./10-plugin-architecture.ts) → [11](./11-multi-tenant.ts) → [12](./12-production-microservice.ts): plugins, tenancy, microservice-shaped bootstrap.

**Short path:** [01](./01-basic-tokens.ts) → [03](./03-scopes-and-child-containers.ts) → [07](./07-real-world-web-app.ts) → [12](./12-production-microservice.ts).

---

## Full index

| File                                                                     | What it covers                                                                                                                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [01-basic-tokens.ts](./01-basic-tokens.ts)                               | Tokens, `toConstantValue`, `toDynamic`, singleton vs transient, `resolveOptional`, `has`                                                                                                      |
| [02-decorators.ts](./02-decorators.ts)                                   | `@injectable`, `inject()`, `optional()`, `.toSelf()`, `.to()`, `.singleton()` on bindings                                                                                                     |
| [03-scopes-and-child-containers.ts](./03-scopes-and-child-containers.ts) | Singleton / transient / scoped lifetimes, `createChild()` for per-request isolation                                                                                                           |
| [04-modules.ts](./04-modules.ts)                                         | `Module.create`, `builder.import`, diamond-dedup, dynamic `load`/`unload`, `inspect()`                                                                                                        |
| [05-async-lifecycle.ts](./05-async-lifecycle.ts)                         | `toDynamicAsync`, `AsyncModule`, `onActivation`, `onDeactivation`, `await using`, parallel inflight dedup                                                                                     |
| [06-constraints-multi-binding.ts](./06-constraints-multi-binding.ts)     | Named & tagged bindings, `whenParentIs`, `resolveAll`                                                                                                                                         |
| [07-real-world-web-app.ts](./07-real-world-web-app.ts)                   | Full web app: modules, scoped request containers, middleware pipeline, validation, graceful shutdown                                                                                          |
| [08-advanced-bindings.ts](./08-advanced-bindings.ts)                     | `toResolved` + `as const`, `toAlias`, plain tokens in `@injectable`, `BindingIdentifier` + `.id()`, `rebind()`                                                                                |
| [09-error-handling.ts](./09-error-handling.ts)                           | All 7 error classes: `TokenNotBoundError`, `NoMatchingBindingError`, `AsyncResolutionError`, `CircularDependencyError`, `MissingMetadataError`, `ScopeViolationError`, `AsyncModuleLoadError` |
| [10-plugin-architecture.ts](./10-plugin-architecture.ts)                 | Plugin platform: module `last-wins` vs direct `container.bind` append, `AsyncModule` plugins, `loadAsync` / `unloadAsync`, hot-swap storage, `resolveAll` registry                            |
| [11-multi-tenant.ts](./11-multi-tenant.ts)                               | Multi-tenant SaaS: shared root pool + `createChild()` per tenant, tenant-scoped tokens (DB, cache, logger, flags, rate limit) without threading context                                       |
| [12-production-microservice.ts](./12-production-microservice.ts)         | Production-style microservice: chained async modules (config, DB, Redis, worker, health, HTTP), `initializeAsync`, `validate`, graceful `dispose`                                             |

---

## Running an example

```bash
cd packages/di
npx tsx examples/01-basic-tokens.ts
```

Swap the filename for any example in the table above.

For deeper API detail, see the [package README](../README.md).
