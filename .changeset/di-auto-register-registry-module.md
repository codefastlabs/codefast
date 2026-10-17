---
"@codefast/di": minor
---

**Breaking:** an auto-register registry is now a `SyncModule`, and `Container#loadAutoRegistered` is removed.
`createAutoRegisterRegistry(name)` takes the module's display name, and the registry loads like any other module —
deduplicated by identity, ref-counted, and torn down by `unload()` / `unloadAsync()`, which deactivates every singleton
it bound. `loadAutoRegistered` was a bare bind loop: it could not be unloaded, and a second call rebound the whole set
over the first.

Migrate:

```ts
// before
const registry = createAutoRegisterRegistry();
const count = container.loadAutoRegistered(registry);

// after
const registry = createAutoRegisterRegistry("app:Services");
container.load(registry); // or Container.fromModules(registry)
const count = registry.entries().length; // if you used the returned count
```

A load binds the classes registered by then; a second `load()` of the same registry only adds a reference, so a class
decorated after the first load is bound by unloading the registry to zero and loading it again.
