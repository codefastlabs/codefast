/**
 * Example 10 — Plugin Architecture
 *
 * Builds an extensible application platform where every capability (storage,
 * analytics, notifications) is a hot-swappable plugin module.
 *
 * Key architectural insight about multi-binding:
 *   - bind() is slot-aware last-wins for both container and module builders.
 *   - To keep multiple bindings under one token, register each one in a
 *     distinct slot (e.g. whenNamed("storage"), whenNamed("analytics")).
 *
 * The pattern therefore is:
 *   1. Each plugin MODULE binds its own capability token (StorageToken, etc.)
 *   2. The PLATFORM registers plugin descriptors via direct container.bind()
 *      with distinct whenNamed(...) slots, enabling resolveAll(PluginToken).
 *
 * Without DI: hand-wire every plugin's dependencies, track which plugins are
 * active, manually tear down connections on unload.
 * With DI:
 *   - Each plugin is an AsyncModule: self-contained, declares its own deps
 *   - container.load / container.unload hot-swaps a plugin at runtime, firing
 *     onDeactivation hooks so resources (connection pools, flush queues) are
 *     cleaned up correctly
 *   - Diamond-import dedup means CoreModule (Logger, Config) is wired once
 *     no matter how many plugins import it
 *   - DocumentService depends only on abstract tokens — it never imports a
 *     plugin class directly; swapping the plugin changes behaviour at runtime
 *     without touching service code
 *
 * Architecture:
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  Platform container (singletons)                     │
 *   │                                                      │
 *   │  Modules (last-wins per capability token):           │
 *   │  ┌──────────┐  ┌───────────────┐  ┌───────────────┐  │
 *   │  │CoreModule│  │  S3Plugin     │  │AnalyticsPlugin│  │
 *   │  │ Config   │  │ StorageToken  │  │AnalyticsToken │  │
 *   │  │ Logger   │  └───────────────┘  └───────────────┘  │
 *   │  └──────────┘                                        │
 *   │                                                      │
 *   │  Direct container.bind() + named slots:              │
 *   │  PluginToken whenNamed("storage")      = S3          │
 *   │  PluginToken whenNamed("analytics")    = Segment     │
 *   │  PluginToken whenNamed("notifications")= Slack       │
 *   └──────────────────────────────────────────────────────┘
 */

import { Container, inject, injectable, Module, token } from "@codefast/di";

// ============================================================================
// Core contracts
// ============================================================================

const AppConfigToken = token<AppConfig>("AppConfig");
const AppLoggerToken = token<AppLogger>("AppLogger");
const StorageToken = token<StorageProvider>("StorageProvider");
const AnalyticsToken = token<AnalyticsProvider>("AnalyticsProvider");
const NotificationToken = token<NotificationProvider>("NotificationProvider");
const DocumentServiceToken = token<DocumentService>("DocumentService");

// PluginToken is a multi-binding registry with one named slot per capability.
const PluginToken = token<PluginDescriptor>("Plugin");

// ============================================================================
// Shared types
// ============================================================================

interface AppConfig {
  readonly env: "development" | "production";
  readonly region: string;
  readonly s3Bucket: string;
  readonly slackWebhook: string;
  readonly analyticsKey: string;
}

interface AppLogger {
  info(msg: string): void;
  warn(msg: string): void;
}

interface StorageProvider {
  readonly name: string;
  upload(key: string, data: string): Promise<string>;
  download(key: string): Promise<string>;
}

interface AnalyticsProvider {
  readonly name: string;
  track(event: string, properties?: Record<string, unknown>): void;
  flush(): Promise<void>;
}

interface NotificationProvider {
  readonly name: string;
  send(channel: string, message: string): Promise<void>;
}

// Plugin descriptor — metadata about a loaded plugin, registered directly
// on the container (not via module api) to support multi-binding.
interface PluginDescriptor {
  readonly name: string;
  readonly version: string;
  readonly capabilities: Array<string>;
}

// ============================================================================
// CoreModule — shared infrastructure, loaded once (diamond-dedup)
// ============================================================================

const CoreModule = Module.create("Core", (builder) => {
  builder.bind(AppConfigToken).toConstantValue({
    env: "production",
    region: "ap-southeast-1",
    s3Bucket: "myapp-uploads",
    slackWebhook: "https://hooks.slack.com/services/xxx",
    analyticsKey: "ak_live_xxx",
  });

  builder.bind(AppLoggerToken).toConstantValue({
    info: (msg) => console.log(`  [INFO]  ${msg}`),
    warn: (msg) => console.log(`  [WARN]  ${msg}`),
  });
});

// ============================================================================
// S3 Storage plugin
// ============================================================================

class S3StorageProvider implements StorageProvider {
  readonly name = "s3";
  private readonly store = new Map<string, string>();

  constructor(
    private readonly bucket: string,
    private readonly region: string,
    private readonly logger: AppLogger,
  ) {}

  async upload(key: string, data: string): Promise<string> {
    await simulateLatency(15);
    this.store.set(key, data);
    const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    this.logger.info(`[S3] uploaded → s3://${this.bucket}/${key}`);
    return publicUrl;
  }

  async download(key: string): Promise<string> {
    await simulateLatency(10);
    const storedData = this.store.get(key);
    if (!storedData) {
      throw new Error(`S3: key not found: ${key}`);
    }
    this.logger.info(`[S3] downloaded ← s3://${this.bucket}/${key}`);
    return storedData;
  }

  closeConnectionPool(): void {
    this.logger.info("[S3] connection pool closed");
  }
}

const S3PluginModule = Module.createAsync("S3Plugin", async (builder) => {
  // CoreModule imported here — deduped if already loaded
  builder.import(CoreModule);

  builder
    .bind(StorageToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(AppConfigToken);
      const logger = ctx.resolve(AppLoggerToken);
      await simulateLatency(20);
      logger.info(`[S3Plugin] initialised in region ${config.region}`);
      return new S3StorageProvider(config.s3Bucket, config.region, logger);
    })
    .singleton()
    .onDeactivation((provider) => {
      (provider as S3StorageProvider).closeConnectionPool();
    });
});

// ============================================================================
// Analytics plugin — Segment-style batched event tracking
// ============================================================================

class SegmentAnalyticsProvider implements AnalyticsProvider {
  readonly name = "segment";
  private readonly eventQueue: Array<{ event: string; properties?: Record<string, unknown> }> = [];

  constructor(
    private readonly apiKey: string,
    private readonly logger: AppLogger,
  ) {}

  track(event: string, properties?: Record<string, unknown>): void {
    this.eventQueue.push(properties !== undefined ? { event, properties } : { event });
    this.logger.info(`[Segment] queued "${event}" (queue: ${this.eventQueue.length})`);
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }
    await simulateLatency(30);
    this.logger.info(`[Segment] flushed ${this.eventQueue.length} events`);
    this.eventQueue.length = 0;
  }

  async shutdown(): Promise<void> {
    await this.flush();
    this.logger.info("[Segment] shutdown complete");
  }
}

const AnalyticsPluginModule = Module.createAsync("AnalyticsPlugin", async (builder) => {
  builder.import(CoreModule); // deduped — CoreModule setup runs exactly once

  builder
    .bind(AnalyticsToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(AppConfigToken);
      const logger = ctx.resolve(AppLoggerToken);
      await simulateLatency(10);
      logger.info("[AnalyticsPlugin] initialised");
      return new SegmentAnalyticsProvider(config.analyticsKey, logger);
    })
    .singleton()
    .onDeactivation(async (provider) => {
      await (provider as SegmentAnalyticsProvider).shutdown();
    });
});

// ============================================================================
// Notification plugin — Slack webhooks
// ============================================================================

class SlackNotificationProvider implements NotificationProvider {
  readonly name = "slack";

  constructor(
    private readonly webhookUrl: string,
    private readonly logger: AppLogger,
  ) {}

  async send(channel: string, message: string): Promise<void> {
    await simulateLatency(25);
    this.logger.info(`[Slack] #${channel}: "${message}"`);
  }
}

const SlackPluginModule = Module.createAsync("SlackPlugin", async (builder) => {
  builder.import(CoreModule); // third import of CoreModule — still runs only once

  builder
    .bind(NotificationToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(AppConfigToken);
      const logger = ctx.resolve(AppLoggerToken);
      logger.info("[SlackPlugin] initialised");
      return new SlackNotificationProvider(config.slackWebhook, logger);
    })
    .singleton();
});

// ============================================================================
// DocumentService — orchestrates all three plugins via abstract tokens
// Never imports a plugin class directly
// ============================================================================

interface DocumentService {
  uploadDocument(userId: string, filename: string, content: string): Promise<string>;
  downloadDocument(userId: string, filename: string): Promise<string>;
}

@injectable([
  inject(StorageToken),
  inject(AnalyticsToken),
  inject(NotificationToken),
  inject(AppLoggerToken),
])
class DocumentOrchestrator implements DocumentService {
  constructor(
    private readonly storage: StorageProvider,
    private readonly analytics: AnalyticsProvider,
    private readonly notifications: NotificationProvider,
    private readonly logger: AppLogger,
  ) {}

  async uploadDocument(userId: string, filename: string, content: string): Promise<string> {
    this.logger.info(`Uploading "${filename}" for user ${userId}`);
    const storageKey = `users/${userId}/documents/${filename}`;
    const publicUrl = await this.storage.upload(storageKey, content);

    this.analytics.track("document.uploaded", {
      userId,
      filename,
      storageProvider: this.storage.name,
      bytes: content.length,
    });

    await this.notifications.send(
      "uploads",
      `📄 ${userId} uploaded "${filename}" (${content.length} bytes)`,
    );

    return publicUrl;
  }

  async downloadDocument(userId: string, filename: string): Promise<string> {
    const storageKey = `users/${userId}/documents/${filename}`;
    const content = await this.storage.download(storageKey);
    this.analytics.track("document.downloaded", { userId, filename });
    return content;
  }
}

// ============================================================================
// LocalStorage plugin — used to demonstrate hot-swap at runtime
// ============================================================================

class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private readonly store = new Map<string, string>();

  constructor(private readonly logger: AppLogger) {}

  async upload(key: string, data: string): Promise<string> {
    this.store.set(key, data);
    this.logger.info(`[LocalStorage] stored "${key}" in memory`);
    return `local://${key}`;
  }

  async download(key: string): Promise<string> {
    const storedData = this.store.get(key);
    if (!storedData) {
      throw new Error(`LocalStorage: key not found: ${key}`);
    }
    return storedData;
  }
}

const LocalStoragePluginModule = Module.createAsync("LocalStoragePlugin", async (builder) => {
  builder.import(CoreModule);

  builder
    .bind(StorageToken)
    .toDynamicAsync(async (ctx) => {
      const logger = ctx.resolve(AppLoggerToken);
      logger.info("[LocalStoragePlugin] initialised");
      return new LocalStorageProvider(logger);
    })
    .singleton();
});

// ============================================================================
// Platform — the plugin host
// ============================================================================

class Platform {
  private container!: Container;

  async boot(): Promise<void> {
    console.log("\n🚀 Booting platform...");

    // Load infrastructure modules — CoreModule deduped across all three
    this.container = await Container.fromModulesAsync(
      CoreModule,
      S3PluginModule,
      AnalyticsPluginModule,
      SlackPluginModule,
    );

    // Eagerly warm up all singletons before serving traffic
    await this.container.initializeAsync();
    this.container.validate();

    // Register plugin descriptors directly on the container with named slots.
    this.container
      .bind(PluginToken)
      .toConstantValue({
        name: "S3StoragePlugin",
        version: "2.1.0",
        capabilities: ["storage"],
      })
      .whenNamed("storage");
    this.container
      .bind(PluginToken)
      .toConstantValue({
        name: "SegmentAnalyticsPlugin",
        version: "1.4.2",
        capabilities: ["analytics"],
      })
      .whenNamed("analytics");
    this.container
      .bind(PluginToken)
      .toConstantValue({
        name: "SlackNotificationPlugin",
        version: "3.0.1",
        capabilities: ["notifications"],
      })
      .whenNamed("notifications");

    // Register DocumentService — resolves via async tokens, so use toDynamicAsync
    this.container
      .bind(DocumentServiceToken)
      .toDynamicAsync(async (ctx) => {
        const storage = await ctx.resolveAsync(StorageToken);
        const analytics = await ctx.resolveAsync(AnalyticsToken);
        const notifications = await ctx.resolveAsync(NotificationToken);
        const logger = ctx.resolve(AppLoggerToken);
        return new DocumentOrchestrator(storage, analytics, notifications, logger);
      })
      .singleton();

    // Print loaded plugins — resolveAll reads all three container.bind() entries
    const loadedPlugins = this.container.resolveAll(PluginToken);
    console.log(`\n✅ ${loadedPlugins.length} plugin(s) loaded:`);
    for (const pluginDescriptor of loadedPlugins) {
      console.log(
        `   • ${pluginDescriptor.name} v${pluginDescriptor.version} [${pluginDescriptor.capabilities.join(", ")}]`,
      );
    }
  }

  async runWithDocumentService<T>(
    callback: (documentService: DocumentService) => Promise<T>,
  ): Promise<T> {
    const documentService = await this.container.resolveAsync(DocumentServiceToken);
    return callback(documentService);
  }

  async hotSwapStoragePlugin(
    newPluginModule: Awaited<ReturnType<typeof Module.createAsync>>,
    newDescriptor: PluginDescriptor,
  ): Promise<void> {
    console.log(`\n🔄 Hot-swapping storage plugin → ${newDescriptor.name}...`);

    // Unload old plugin — fires onDeactivation (closes S3 connection pool)
    await this.container.unloadAsync(S3PluginModule);

    // Re-register DocumentService without the old storage singleton
    this.container
      .rebind(DocumentServiceToken)
      .toDynamicAsync(async (ctx) => {
        const storage = await ctx.resolveAsync(StorageToken);
        const analytics = await ctx.resolveAsync(AnalyticsToken);
        const notifications = await ctx.resolveAsync(NotificationToken);
        const logger = ctx.resolve(AppLoggerToken);
        return new DocumentOrchestrator(storage, analytics, notifications, logger);
      })
      .singleton();

    // Load new storage plugin and warm up only its singleton
    await this.container.loadAsync(newPluginModule);
    await this.container.resolveAsync(StorageToken);

    // Register new descriptor in the same named slot to replace old storage descriptor.
    this.container.bind(PluginToken).toConstantValue(newDescriptor).whenNamed("storage");

    const activePlugins = this.container.resolveAll(PluginToken);
    console.log(
      `   Active plugins (${activePlugins.length}): ${activePlugins.map((pluginDescriptor) => pluginDescriptor.name).join(", ")}`,
    );
  }

  async flushAnalytics(): Promise<void> {
    const analyticsProvider = await this.container.resolveAsync(AnalyticsToken);
    await analyticsProvider.flush();
  }

  async shutdown(): Promise<void> {
    console.log("\n🛑 Shutting down platform...");
    await this.container.dispose(); // fires all onDeactivation hooks
    console.log("✅ Platform shutdown complete");
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const platform = new Platform();
  await platform.boot();

  // --- Normal operation -------------------------------------------------------
  console.log("\n📋 Normal operation (S3 storage):");
  await platform.runWithDocumentService(async (documentService) => {
    const uploadedUrl = await documentService.uploadDocument(
      "user-123",
      "report-q4.pdf",
      "Q4 earnings: $2.4M revenue, +34% YoY",
    );
    console.log(`   Uploaded URL: ${uploadedUrl}`);

    const downloadedContent = await documentService.downloadDocument("user-123", "report-q4.pdf");
    console.log(`   Downloaded: "${downloadedContent.slice(0, 40)}"`);
  });

  await platform.flushAnalytics();

  // --- Hot-swap storage plugin at runtime ------------------------------------
  // The analytics and notification plugins stay untouched.
  // DocumentService automatically gets the new storage backend.
  await platform.hotSwapStoragePlugin(LocalStoragePluginModule, {
    name: "LocalStoragePlugin",
    version: "1.0.0",
    capabilities: ["storage"],
  });

  console.log("\n📋 Operation after hot-swap (LocalStorage):");
  await platform.runWithDocumentService(async (documentService) => {
    const uploadedUrl = await documentService.uploadDocument(
      "user-456",
      "memo.txt",
      "Meeting notes: launch date confirmed for Q1",
    );
    console.log(`   Uploaded URL: ${uploadedUrl}`);
  });

  await platform.shutdown();
}

function simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
