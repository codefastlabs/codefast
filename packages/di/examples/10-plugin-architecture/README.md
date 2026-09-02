# Example 10 — Plugin Architecture

**Concepts:** `Module.createAsync`, `container.loadAsync()` / `container.unloadAsync()`, named multi-binding slots,
`onDeactivation` for resource cleanup, diamond deduplication across plugins

---

## What this example shows

How to build an application platform where every capability (storage, analytics, notifications) is a self-contained,
hot-swappable plugin. Plugins can be loaded and unloaded at runtime; the `DocumentService` that uses them never imports
a plugin class directly.

---

## Diagram

### Plugin system architecture

```mermaid
graph TB
    subgraph Platform["Platform Container"]
        Core["CoreModule\n(Config, Logger)\nshared by all plugins"]

        subgraph Plugins["Plugin Modules (hot-swappable)"]
            S3["S3PluginModule\nStorageToken\nonDeactivation: closePool()"]
            Seg["AnalyticsPluginModule\nAnalyticsToken\nonDeactivation: flush()"]
            Slack["SlackPluginModule\nNotificationToken\nonDeactivation: drain()"]
        end

        subgraph Registry["Named Plugin Registry"]
            P1["PluginToken whenNamed('storage')"]
            P2["PluginToken whenNamed('analytics')"]
            P3["PluginToken whenNamed('notifications')"]
        end
    end

    Core -->|diamond dedup| S3 & Seg & Slack
    S3 --> P1
    Seg --> P2
    Slack --> P3

    Doc["DocumentService\n@injectable([StorageToken,\n  AnalyticsToken,\n  NotificationToken])"]
    P1 & P2 & P3 -->|resolveAll| Plugins
    Plugins --> Doc
```

### Hot-swap sequence

```mermaid
sequenceDiagram
    participant App
    participant Container

    Note over Container: S3PluginModule bound to StorageToken (from boot)

    App->>Container: unloadAsync(S3PluginModule)
    Note over Container: onDeactivation → closeConnectionPool() called

    App->>Container: loadAsync(LocalStoragePluginModule)
    Note over Container: LocalStorageProvider now bound to StorageToken

    App->>Container: resolveAsync(DocumentServiceToken)
    Note over Container: DocumentService gets LocalStorageProvider — no code change
```

## The core insight: modules as plugins

Each capability is an `AsyncModule` that:

1. Imports `CoreModule` (logger, config) — deduped automatically
2. Binds its capability token (`StorageToken`, `AnalyticsToken`, …)
3. Owns its own async `onActivation` (open connections) and `onDeactivation` (close them)

```ts
const S3PluginModule = Module.createAsync("S3Plugin", async (builder) => {
  builder.import(CoreModule); // shared config & logger

  builder
    .bind(StorageToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(AppConfigToken);
      return new S3StorageProvider(config.s3Bucket, config.region, logger);
    })
    .singleton()
    .onDeactivation((provider) => provider.closeConnectionPool());
});
```

---

## Multi-binding for plugin descriptors

A `PluginToken` multi-binding registry keeps one named slot per capability. This allows `resolveAll(PluginToken)` to
enumerate every loaded plugin:

```ts
// After loading modules, register a named descriptor for each capability
container
  .bind(PluginToken)
  .toConstantValue({ name: "s3", version: "1.0", capabilities: ["upload"] })
  .whenNamed("storage");
container
  .bind(PluginToken)
  .toConstantValue({ name: "segment", version: "2.1", capabilities: ["track"] })
  .whenNamed("analytics");

const plugins = container.resolveAll(PluginToken);
plugins.forEach((p) => console.log(p.name)); // "s3", "segment", ...
```

---

## Hot-swap at runtime

`loadAsync` and `unloadAsync` work after the container is created:

```ts
// Swap the storage plugin at runtime: S3 → LocalStorage
await container.unloadAsync(S3PluginModule); // fires onDeactivation → closeConnectionPool()

// Rebuild the DocumentService singleton so it picks up the new storage binding
container.rebind(DocumentServiceToken).toDynamicAsync(/* same async factory */).singleton();

await container.loadAsync(LocalStoragePluginModule);
await container.resolveAsync(StorageToken); // warm the new storage singleton

// DocumentService now uses the LocalStorage provider — zero code change to the class
const documentService = await container.resolveAsync(DocumentServiceToken);
await documentService.uploadDocument("user-456", "memo.txt", "Meeting notes: launch date confirmed");
```

`onDeactivation` fires when the old module is unloaded — the S3 connection pool is closed before the new plugin takes
over.

---

## Consumer stays abstraction-clean

```ts
@injectable([inject(StorageToken), inject(AnalyticsToken), inject(NotificationToken)])
class DocumentService {
  // depends only on interfaces — knows nothing about S3, Segment, or Slack
}
```

Swapping a plugin changes behaviour without touching `DocumentService`.

---

## Diamond deduplication

```
AppContainer
├── S3PluginModule → CoreModule (logger, config)
├── AnalyticsModule → CoreModule (already loaded, skipped)
└── NotificationsModule → CoreModule (already loaded, skipped)
```

`CoreModule` setup runs once no matter how many plugins import it.

---

## What to read next

- **Example 04** — module fundamentals and diamond deduplication.
- **Example 05** — async lifecycle hooks (`onActivation` / `onDeactivation`).
- **Example 11** — same pattern applied to multi-tenant isolation.

## License

Released under the [MIT License](../../LICENSE).
