# @codefast/di — Examples

A progressive set of runnable examples covering every feature of `@codefast/di`. Each example is a standalone TypeScript
file you can run with `tsx` or `ts-node`.

```sh
npx tsx examples/01-basic-tokens/01-basic-tokens.ts
```

Run every example in sequence with a per-example PASS/FAIL summary:

```sh
pnpm run examples
```

The examples share a small tiered console helper (`examples/support/log.ts`) — `banner` → `section` → `step`, plus the
leaf markers `item`, `ok`, `fail`, and `caughtError` — so their scaffolding output reads consistently while each keeps
its own domain logging.

---

## Prerequisites

```json
// tsconfig.json — native Stage 3 decorators, NO experimentalDecorators
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler"
  }
}
```

---

## Example Index

| #   | Directory                                                                  | What it teaches                                                                                |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 01  | [01-basic-tokens](./01-basic-tokens)                                       | `token()`, `toConstantValue`, `toDynamic`, `singleton`, `transient`, `resolveOptional`         |
| 02  | [02-decorators](./02-decorators)                                           | `@injectable`, `inject()`, `optional()`, `.to()`, `.toSelf()`                                  |
| 03  | [03-scopes-and-child-containers](./03-scopes-and-child-containers)         | `singleton` / `transient` / `scoped` lifetimes, `createChild()`                                |
| 04  | [04-modules](./04-modules)                                                 | `Module.create()`, `builder.import()`, diamond deduplication, `load` / `unload`                |
| 05  | [05-async-lifecycle](./05-async-lifecycle)                                 | `toDynamicAsync`, `onActivation`, `onDeactivation`, `AsyncModule`, `await using`               |
| 06  | [06-constraints-multi-binding](./06-constraints-multi-binding)             | `whenNamed`, `whenTagged`, `whenParentIs`, `resolveAll`                                        |
| 07  | [07-real-world-web-app](./07-real-world-web-app)                           | Full web-app wiring: async modules, scoped per-request containers, middleware pipeline         |
| 08  | [08-advanced-bindings](./08-advanced-bindings)                             | `toResolved`, `toAlias`, `BindingIdentifier`, `rebind()`, plain tokens in `@injectable`        |
| 09  | [09-error-handling](./09-error-handling)                                   | All error types with `.code` — how to catch and recover from each                              |
| 10  | [10-plugin-architecture](./10-plugin-architecture)                         | Hot-swappable plugin system with async modules and named slots                                 |
| 11  | [11-multi-tenant](./11-multi-tenant)                                       | Isolated child containers per tenant, feature flags, per-plan rate limiting                    |
| 12  | [12-production-microservice](./12-production-microservice)                 | Full microservice lifecycle: config, DB/Redis pools, health checks, graceful shutdown          |
| 13  | [13-ecommerce-platform](./13-ecommerce-platform)                           | Domain-rich e-commerce backend showcasing all DI features together                             |
| 14  | [14-auto-register](./14-auto-register)                                     | `createAutoRegisterRegistry()`, `autoRegister` decorator option, `loadAutoRegistered()`        |
| 15  | [15-inspection-graph](./15-inspection-graph)                               | `inspect()`, `lookupBindings()`, `generateDependencyGraph()`, DOT / Cytoscape adapters         |
| 16  | [16-testing-patterns](./16-testing-patterns)                               | Fresh containers, `rebind()` stubs, child-container overrides, `validate()`                    |
| 17  | [17-extended-constraints](./17-extended-constraints)                       | Full constraint family: `whenAnyAncestorIs`, `whenParentNamed`, `whenParentTaggedAll`, …       |
| 18  | [18-ambient-container](./18-ambient-container)                             | `@inject()` accessor injection, `getActiveContainer()`, `runWithContainer()`                   |
| 19  | [19-custom-metadata-reader](./19-custom-metadata-reader)                   | `MetadataReader`, `MetadataReaderToken` — wiring classes that carry no decorators              |
| 20  | [20-explicit-architecture](./20-explicit-architecture)                     | Multi-file Ports & Adapters app; `@injectable` wiring with a framework-free domain             |
| 21  | [21-explicit-architecture-ecommerce](./21-explicit-architecture-ecommerce) | Larger multi-context Ports & Adapters with `@injectable`; HTTP + CLI, config-selected adapters |

---

## Learning Path

**Start here** → `01` → `02` → `03` → `04` → `05`

These five examples build a complete mental model: tokens, class injection, scopes, modules, and async lifecycle.
Everything else builds on top of them.

**Then pick by need:**

- Selecting between multiple implementations → `06`, `17`
- Structuring a real application → `07`, `10`, `11`, `12`, `13`
- Keeping the DI container out of your domain (Explicit / Hexagonal Architecture) → `20` (one context), `21`
  (multi-context, larger)
- Advanced binding strategies → `08`
- Error diagnosis → `09`
- Reducing boilerplate → `14`
- Debugging / architecture review → `15`
- Writing tests → `16`
- Injecting into properties, or into objects a framework constructs → `18`
- Wiring classes you cannot decorate → `19`

## License

Released under the [MIT License](../LICENSE).
