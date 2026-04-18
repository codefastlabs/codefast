# @codefast/di — Examples

| File                                                                     | What it covers                                                                                                                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [01-basic-tokens.ts](./01-basic-tokens.ts)                               | Tokens, `toConstantValue`, `toDynamic`, singleton vs transient, `resolveOptional`, `has`                                                                                                      |
| [02-decorators.ts](./02-decorators.ts)                                   | `@injectable`, `@singleton`, `inject()`, `optional()`, `.toSelf()`, `.to()`                                                                                                                   |
| [03-scopes-and-child-containers.ts](./03-scopes-and-child-containers.ts) | Singleton / transient / scoped lifetimes, `createChild()` for per-request isolation                                                                                                           |
| [04-modules.ts](./04-modules.ts)                                         | `Module.create`, `api.import`, diamond-dedup, dynamic `load`/`unload`, `inspect()`                                                                                                            |
| [05-async-lifecycle.ts](./05-async-lifecycle.ts)                         | `toDynamicAsync`, `AsyncModule`, `onActivation`, `onDeactivation`, `await using`, parallel inflight dedup                                                                                     |
| [06-constraints-multi-binding.ts](./06-constraints-multi-binding.ts)     | Named & tagged bindings, `whenParentIs`, `resolveAll`                                                                                                                                         |
| [07-real-world-web-app.ts](./07-real-world-web-app.ts)                   | Full web app: modules, scoped request containers, middleware pipeline, validation, graceful shutdown                                                                                          |
| [08-advanced-bindings.ts](./08-advanced-bindings.ts)                     | `toResolved` + `as const`, `toAlias`, plain tokens in `@injectable`, `BindingIdentifier` + `.id()`, `rebind()`                                                                                |
| [09-error-handling.ts](./09-error-handling.ts)                           | All 7 error classes: `TokenNotBoundError`, `NoMatchingBindingError`, `AsyncResolutionError`, `CircularDependencyError`, `MissingMetadataError`, `ScopeViolationError`, `AsyncModuleLoadError` |

## Running an example

```bash
cd packages/di
npx tsx examples/01-basic-tokens.ts
```
