/**
 * Example 05 — Async Factories, Lifecycle Hooks & Disposal
 *
 * Shows:
 * - toDynamicAsync / toResolvedAsync for async initialization
 * - onActivation (runs after creation) / onDeactivation (runs on dispose)
 * - AsyncModule for async bootstrap
 * - container.dispose() with `await using`
 * - Parallel inflight deduplication for async singletons
 */

import { Container, inject, injectable, Module, token } from "@codefast/di";

// --- Tokens -----------------------------------------------------------------

const ConfigToken = token<Config>("Config");
const DatabaseToken = token<Database>("Database");
const CacheToken = token<Cache>("Cache");
const AppToken = token<App>("App");

// --- Domain -----------------------------------------------------------------

interface Config {
  dbUrl: string;
  cacheUrl: string;
}

class Database {
  private connected = false;

  constructor(readonly url: string) {}

  async connect(): Promise<void> {
    await delay(20); // simulate async
    this.connected = true;
    console.log(`[Database] connected to ${this.url}`);
  }

  async disconnect(): Promise<void> {
    await delay(10);
    this.connected = false;
    console.log(`[Database] disconnected`);
  }

  isConnected(): boolean {
    return this.connected;
  }

  query(sql: string): string {
    if (!this.connected) {
      throw new Error("Not connected");
    }
    return `result(${sql})`;
  }
}

class Cache {
  private isStarted = false;
  private readonly store = new Map<string, string>();

  constructor(readonly url: string) {}

  async start(): Promise<void> {
    await delay(10);
    this.isStarted = true;
    console.log(`[Cache] started at ${this.url}`);
  }

  async stop(): Promise<void> {
    await delay(5);
    this.isStarted = false;
    console.log(`[Cache] stopped`);
  }

  get(key: string): string | undefined {
    return this.store.get(key);
  }
}

@injectable([inject(DatabaseToken), inject(CacheToken)])
class App {
  constructor(
    private readonly database: Database,
    private readonly cache: Cache,
  ) {}

  run(query: string): string {
    const cached = this.cache.get(query);
    return cached ?? this.database.query(query);
  }
}

// --- AsyncModule ------------------------------------------------------------

const InfrastructureModule = Module.createAsync("Infra", async (builder) => {
  // Async module setup — fetch config from "remote" source
  const config = await fetchConfig();
  builder.bind(ConfigToken).toConstantValue(config);
});

const DatabaseModule = Module.create("Database", (builder) => {
  // toDynamicAsync: async factory with access to ResolutionContext
  builder
    .bind(DatabaseToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(ConfigToken);
      return new Database(config.dbUrl);
    })
    .singleton()
    // onActivation: called after instance is created; can be async
    .onActivation(async (_ctx, database) => {
      await database.connect();
      return database; // must return the (possibly transformed) instance
    })
    // onDeactivation: called during container.dispose()
    .onDeactivation(async (database) => {
      await database.disconnect();
    });
});

const CacheModule = Module.create("Cache", (builder) => {
  builder
    .bind(CacheToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(ConfigToken);
      return new Cache(config.cacheUrl);
    })
    .singleton()
    .onActivation(async (_ctx, cache) => {
      await cache.start();
      return cache;
    })
    .onDeactivation(async (cache) => {
      await cache.stop();
    });
});

const AppModule = Module.create("App", (builder) => {
  builder.bind(AppToken).to(App).singleton();
});

// --- Bootstrap & teardown ---------------------------------------------------

async function main(): Promise<void> {
  // await using — container.dispose() is called automatically at scope exit
  await using container = await Container.fromModulesAsync(
    InfrastructureModule,
    DatabaseModule,
    CacheModule,
    AppModule,
  );

  // initializeAsync: eagerly resolve all singletons (including async ones)
  await container.initializeAsync();

  const app = await container.resolveAsync(AppToken);
  console.log(app.run("SELECT 1")); // result(SELECT 1)

  // Parallel inflight deduplication: two concurrent resolves share one Promise
  const [firstDatabaseResolve, secondDatabaseResolve] = await Promise.all([
    container.resolveAsync(DatabaseToken),
    container.resolveAsync(DatabaseToken),
  ]);

  console.log(
    "Same Database instance (parallel resolve):",
    firstDatabaseResolve === secondDatabaseResolve,
  ); // true
  console.log("Database connected:", firstDatabaseResolve.isConnected()); // true

  // container.dispose() fires all onDeactivation hooks in reverse order
  // (handled automatically by `await using`)
}

// --- Utilities --------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchConfig(): Promise<Config> {
  await delay(5); // simulate remote fetch
  return { dbUrl: "postgres://localhost/prod", cacheUrl: "redis://localhost:6379" };
}

main().catch(console.error);
