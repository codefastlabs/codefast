/**
 * Example 11 — Multi-Tenant SaaS Application
 *
 * Each tenant gets a completely isolated child container with its own:
 * - Database connection (separate connection string per tenant)
 * - Redis cache namespace (key prefix per tenant)
 * - Logger enriched with tenant context
 * - Feature flags (plan-specific behaviour)
 * - Rate limiter (quota per plan)
 *
 * Without DI this isolation requires either:
 *   (a) Thread-locals / async-storage — fragile, not composable
 *   (b) Passing tenant context through every function call — viral coupling
 *   (c) Factories that take a tenant param — defeats abstraction
 *
 * With DI: root container holds shared infrastructure (connection pools,
 * config). For each request we call rootContainer.createChild(), bind the
 * tenant-specific context once, and every service downstream automatically
 * gets the right database, logger, and feature flags — without any param
 * threading.
 *
 * Architecture:
 *
 *   rootContainer (singleton)
 *   ├── DatabasePoolToken   → shared PgPool (all tenants share one pool)
 *   ├── AppConfigToken      → global config
 *   └── AppLoggerToken      → base logger
 *
 *   tenantContainer (child, one per request)
 *   ├── TenantContextToken  → { tenantId, plan, dbSchema }
 *   ├── TenantDbToken       → TenantDatabase (wraps pool, namespaced to schema)
 *   ├── TenantCacheToken    → TenantCache (key-prefixed Redis stub)
 *   ├── TenantLoggerToken   → logger with tenantId in every line
 *   ├── FeatureFlagsToken   → plan-gated feature set
 *   ├── RateLimiterToken    → per-plan quota
 *   └── UserServiceToken    → uses all of the above
 */

import { Container, Module, inject, injectable, token } from "@codefast/di";
import { randomBytes } from "node:crypto";

// ============================================================================
// Global types
// ============================================================================

type TenantPlan = "free" | "pro" | "enterprise";

interface TenantContext {
  readonly tenantId: string;
  readonly plan: TenantPlan;
  readonly dbSchema: string;
}

interface DatabasePool {
  query<T>(schema: string, sql: string, params?: Array<unknown>): Promise<Array<T>>;
  stats(): { activeConnections: number; idleConnections: number };
}

interface TenantDatabase {
  query<T>(sql: string, params?: Array<unknown>): Promise<Array<T>>;
}

interface TenantCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

interface TenantLogger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

interface FeatureFlags {
  isEnabled(flag: string): boolean;
  enabledFlags(): Array<string>;
}

interface RateLimiter {
  checkQuota(operation: string): boolean;
  remaining(operation: string): number;
}

interface User {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
}

interface UserService {
  listUsers(): Promise<Array<User>>;
  createUser(email: string, role: User["role"]): Promise<User>;
}

interface InviteService {
  sendInvite(email: string): Promise<{ inviteId: string }>;
}

// ============================================================================
// Root-level tokens (shared across all tenants)
// ============================================================================

const DatabasePoolToken = token<DatabasePool>("DatabasePool");
const AppConfigToken = token<AppConfig>("AppConfig");
const AppLoggerToken = token<AppLogger>("AppLogger");

interface AppConfig {
  defaultDbUrl: string;
  redisUrl: string;
  maxConnectionsPerTenant: number;
}

interface AppLogger {
  info(msg: string): void;
  error(msg: string): void;
}

// ============================================================================
// Tenant-scoped tokens (isolated per child container)
// ============================================================================

const TenantContextToken = token<TenantContext>("TenantContext");
const TenantDbToken = token<TenantDatabase>("TenantDatabase");
const TenantCacheToken = token<TenantCache>("TenantCache");
const TenantLoggerToken = token<TenantLogger>("TenantLogger");
const FeatureFlagsToken = token<FeatureFlags>("FeatureFlags");
const RateLimiterToken = token<RateLimiter>("RateLimiter");
const UserServiceToken = token<UserService>("UserService");
const InviteServiceToken = token<InviteService>("InviteService");

// ============================================================================
// Shared infrastructure (root singletons)
// ============================================================================

class PostgresConnectionPool implements DatabasePool {
  private totalQueriesExecuted = 0;

  constructor(
    private readonly connectionString: string,
    private readonly maxConnections: number,
  ) {
    console.log(`    [Pool] initialised (max ${maxConnections} connections) → ${connectionString}`);
  }

  async query<T>(schema: string, sql: string, params?: Array<unknown>): Promise<Array<T>> {
    this.totalQueriesExecuted++;
    await delay(5);
    // Stub: return empty result with a log entry
    console.log(`    [Pool] schema=${schema} sql="${sql}" params=${JSON.stringify(params ?? [])}`);
    return [] as Array<T>;
  }

  stats(): { activeConnections: number; idleConnections: number } {
    return { activeConnections: 3, idleConnections: this.maxConnections - 3 };
  }

  async close(): Promise<void> {
    await delay(10);
    console.log(`    [Pool] closed after ${this.totalQueriesExecuted} total queries`);
  }
}

// ============================================================================
// Tenant-scoped implementations
// ============================================================================

class TenantDatabaseConnection implements TenantDatabase {
  constructor(
    private readonly pool: DatabasePool,
    private readonly schema: string,
    private readonly tenantLogger: TenantLogger,
  ) {}

  async query<T>(sql: string, params?: Array<unknown>): Promise<Array<T>> {
    this.tenantLogger.info(`db.query`, { sql, params });
    return this.pool.query<T>(this.schema, sql, params);
  }
}

class NamespacedRedisCache implements TenantCache {
  private readonly store = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(
    private readonly keyPrefix: string,
    private readonly tenantLogger: TenantLogger,
  ) {}

  private fullKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(this.fullKey(key));
    if (!entry || Date.now() > entry.expiresAt) {
      return undefined;
    }
    this.tenantLogger.info(`cache.hit`, { key });
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    this.store.set(this.fullKey(key), { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    this.tenantLogger.info(`cache.set`, { key, ttlSeconds });
  }

  async invalidate(pattern: string): Promise<void> {
    const prefix = this.fullKey(pattern);
    let deletedCount = 0;
    for (const cachedKey of this.store.keys()) {
      if (cachedKey.startsWith(prefix)) {
        this.store.delete(cachedKey);
        deletedCount++;
      }
    }
    this.tenantLogger.info(`cache.invalidate`, { pattern, deletedCount });
  }
}

class PlanFeatureFlags implements FeatureFlags {
  private static readonly PLAN_FLAGS: Record<TenantPlan, Array<string>> = {
    free: ["basic_auth", "file_upload"],
    pro: ["basic_auth", "file_upload", "api_access", "webhooks", "advanced_analytics"],
    enterprise: [
      "basic_auth",
      "file_upload",
      "api_access",
      "webhooks",
      "advanced_analytics",
      "sso",
      "audit_logs",
      "custom_domain",
      "priority_support",
    ],
  };

  constructor(private readonly plan: TenantPlan) {}

  isEnabled(flag: string): boolean {
    return PlanFeatureFlags.PLAN_FLAGS[this.plan].includes(flag);
  }

  enabledFlags(): Array<string> {
    return PlanFeatureFlags.PLAN_FLAGS[this.plan];
  }
}

class PlanRateLimiter implements RateLimiter {
  private static readonly QUOTAS: Record<TenantPlan, Record<string, number>> = {
    free: { api_call: 100, file_upload: 10, invite: 3 },
    pro: { api_call: 10_000, file_upload: 500, invite: 50 },
    enterprise: { api_call: Infinity, file_upload: Infinity, invite: Infinity },
  };

  private readonly usage = new Map<string, number>();

  constructor(
    private readonly plan: TenantPlan,
    private readonly tenantLogger: TenantLogger,
  ) {}

  checkQuota(operation: string): boolean {
    const quota = PlanRateLimiter.QUOTAS[this.plan][operation] ?? 0;
    const used = this.usage.get(operation) ?? 0;
    if (used >= quota) {
      this.tenantLogger.warn(`rate_limit.exceeded`, { operation, quota, used });
      return false;
    }
    this.usage.set(operation, used + 1);
    return true;
  }

  remaining(operation: string): number {
    const quota = PlanRateLimiter.QUOTAS[this.plan][operation] ?? 0;
    const used = this.usage.get(operation) ?? 0;
    return Math.max(0, quota === Infinity ? Infinity : quota - used);
  }
}

// ============================================================================
// Tenant-scoped services — depend only on tenant tokens, never on raw config
// ============================================================================

@injectable([
  inject(TenantDbToken),
  inject(TenantCacheToken),
  inject(TenantLoggerToken),
  inject(FeatureFlagsToken),
  inject(RateLimiterToken),
  inject(TenantContextToken),
])
class TenantUserManager implements UserService {
  constructor(
    private readonly database: TenantDatabase,
    private readonly cache: TenantCache,
    private readonly logger: TenantLogger,
    private readonly features: FeatureFlags,
    private readonly rateLimiter: RateLimiter,
    private readonly tenant: TenantContext,
  ) {}

  async listUsers(): Promise<Array<User>> {
    if (!this.rateLimiter.checkQuota("api_call")) {
      throw new Error(`[${this.tenant.tenantId}] API quota exhausted`);
    }

    const cacheKey = "users:list";
    const cachedUsers = await this.cache.get<Array<User>>(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.database.query<User>(
      "SELECT id, email, role FROM users ORDER BY created_at",
    );
    await this.cache.set(cacheKey, users, 60);
    this.logger.info("users.listed", { count: users.length });
    return users;
  }

  async createUser(email: string, role: User["role"]): Promise<User> {
    if (!this.rateLimiter.checkQuota("api_call")) {
      throw new Error(`[${this.tenant.tenantId}] API quota exhausted`);
    }

    const newUser: User = { id: `usr_${randomBytes(8).toString("hex")}`, email, role };
    await this.database.query("INSERT INTO users (id, email, role) VALUES ($1, $2, $3)", [
      newUser.id,
      newUser.email,
      newUser.role,
    ]);
    await this.cache.invalidate("users:");
    this.logger.info("user.created", { userId: newUser.id, email, role });
    return newUser;
  }
}

@injectable([
  inject(TenantDbToken),
  inject(TenantLoggerToken),
  inject(FeatureFlagsToken),
  inject(RateLimiterToken),
  inject(TenantContextToken),
])
class TenantInviteManager implements InviteService {
  constructor(
    private readonly database: TenantDatabase,
    private readonly logger: TenantLogger,
    private readonly features: FeatureFlags,
    private readonly rateLimiter: RateLimiter,
    private readonly tenant: TenantContext,
  ) {}

  async sendInvite(email: string): Promise<{ inviteId: string }> {
    if (!this.features.isEnabled("api_access")) {
      throw new Error(`[${this.tenant.plan}] api_access feature not available on this plan`);
    }

    if (!this.rateLimiter.checkQuota("invite")) {
      throw new Error(
        `[${this.tenant.tenantId}] Invite quota exhausted (plan: ${this.tenant.plan})`,
      );
    }

    const inviteId = `inv_${randomBytes(8).toString("hex")}`;
    await this.database.query("INSERT INTO invites (id, email, tenant_id) VALUES ($1, $2, $3)", [
      inviteId,
      email,
      this.tenant.tenantId,
    ]);

    this.logger.info("invite.sent", { inviteId, email });
    return { inviteId };
  }
}

// ============================================================================
// Root module — shared infrastructure
// ============================================================================

const InfrastructureModule = Module.createAsync("Infra", async (builder) => {
  builder.bind(AppConfigToken).toConstantValue({
    defaultDbUrl: "postgres://localhost:5432/saas",
    redisUrl: "redis://localhost:6379",
    maxConnectionsPerTenant: 10,
  });

  builder.bind(AppLoggerToken).toConstantValue({
    info: (msg) => console.log(`  [APP]   ${msg}`),
    error: (msg) => console.error(`  [APP]   ${msg}`),
  });

  builder
    .bind(DatabasePoolToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(AppConfigToken);
      return new PostgresConnectionPool(config.defaultDbUrl, config.maxConnectionsPerTenant);
    })
    .singleton()
    .onDeactivation(async (pool) => {
      await (pool as PostgresConnectionPool).close();
    });
});

// ============================================================================
// Tenant container factory
// Creates one child container per tenant request, wiring all scoped services
// ============================================================================

function createTenantContainer(
  rootContainer: Container,
  tenantContext: TenantContext,
  // DatabasePool is resolved once at app boot (async singleton) and passed in.
  // This avoids async resolution inside the sync tenant container factory —
  // the pool is captured as a plain value in each tenant binding's closure.
  sharedDatabasePool: DatabasePool,
): Container {
  const tenantContainer = rootContainer.createChild();

  // Bind tenant identity — everything downstream derives from this one binding
  // toConstantValue is always a fixed value — scope is determined by which
  // container holds the binding (this child), not by a scope modifier.
  tenantContainer.bind(TenantContextToken).toConstantValue(tenantContext);

  // Tenant-scoped logger — enriches every log line with tenantId + plan
  tenantContainer
    .bind(TenantLoggerToken)
    .toDynamic((ctx) => {
      const { tenantId, plan } = ctx.resolve(TenantContextToken);
      const prefix = `[${tenantId}/${plan}]`;
      return {
        info: (msg, meta) =>
          console.log(`  ${prefix} INFO  ${msg}`, meta ? JSON.stringify(meta) : ""),
        warn: (msg, meta) =>
          console.log(`  ${prefix} WARN  ${msg}`, meta ? JSON.stringify(meta) : ""),
        error: (msg, meta) =>
          console.error(`  ${prefix} ERROR ${msg}`, meta ? JSON.stringify(meta) : ""),
      };
    })
    .scoped();

  // Tenant database connection — wraps the shared pool with tenant's schema.
  // sharedDatabasePool is captured in the closure — no async resolution needed.
  tenantContainer
    .bind(TenantDbToken)
    .toDynamic((ctx) => {
      const { dbSchema } = ctx.resolve(TenantContextToken);
      const tenantLogger = ctx.resolve(TenantLoggerToken);
      return new TenantDatabaseConnection(sharedDatabasePool, dbSchema, tenantLogger);
    })
    .scoped();

  // Namespaced cache — each tenant's keys are prefixed with tenantId
  tenantContainer
    .bind(TenantCacheToken)
    .toDynamic((ctx) => {
      const { tenantId } = ctx.resolve(TenantContextToken);
      const tenantLogger = ctx.resolve(TenantLoggerToken);
      return new NamespacedRedisCache(`tenant:${tenantId}`, tenantLogger);
    })
    .scoped();

  // Feature flags — gated by plan
  tenantContainer
    .bind(FeatureFlagsToken)
    .toDynamic((ctx) => {
      const { plan } = ctx.resolve(TenantContextToken);
      return new PlanFeatureFlags(plan);
    })
    .scoped();

  // Rate limiter — quota per plan
  tenantContainer
    .bind(RateLimiterToken)
    .toDynamic((ctx) => {
      const { plan } = ctx.resolve(TenantContextToken);
      const tenantLogger = ctx.resolve(TenantLoggerToken);
      return new PlanRateLimiter(plan, tenantLogger);
    })
    .scoped();

  // Domain services — plain class bindings that read everything from tokens above
  tenantContainer.bind(UserServiceToken).to(TenantUserManager).scoped();
  tenantContainer.bind(InviteServiceToken).to(TenantInviteManager).scoped();

  return tenantContainer;
}

// ============================================================================
// Main — simulate requests from three tenants with different plans
// ============================================================================

async function main(): Promise<void> {
  await using rootContainer = await Container.fromModulesAsync(InfrastructureModule);

  // Resolve the shared DB pool once (async) before creating tenant containers.
  // All tenant containers receive it as a plain value — no repeated async resolution.
  await rootContainer.initializeAsync();
  const sharedDatabasePool = await rootContainer.resolveAsync(DatabasePoolToken);
  console.log("\n✅ Root container ready\n");

  // ── Tenant A: free plan ─────────────────────────────────────────────────
  console.log("════════════════════ Tenant A (free plan) ════════════════════");
  const tenantAContainer = createTenantContainer(
    rootContainer,
    {
      tenantId: "tenant_acme",
      plan: "free",
      dbSchema: "acme",
    },
    sharedDatabasePool,
  );

  const tenantAUserService = tenantAContainer.resolve(UserServiceToken);
  await tenantAUserService.listUsers();
  await tenantAUserService.createUser("alice@acme.com", "admin");

  const tenantAInviteService = tenantAContainer.resolve(InviteServiceToken);
  try {
    await tenantAInviteService.sendInvite("bob@external.com");
  } catch (err) {
    console.log(`  ⛔ Expected error: ${(err as Error).message}`);
  }

  // ── Tenant B: pro plan ──────────────────────────────────────────────────
  console.log("\n════════════════════ Tenant B (pro plan) ═════════════════════");
  const tenantBContainer = createTenantContainer(
    rootContainer,
    {
      tenantId: "tenant_globex",
      plan: "pro",
      dbSchema: "globex",
    },
    sharedDatabasePool,
  );

  const tenantBUserService = tenantBContainer.resolve(UserServiceToken);
  await tenantBUserService.createUser("charlie@globex.com", "member");

  const tenantBInviteService = tenantBContainer.resolve(InviteServiceToken);
  const invite = await tenantBInviteService.sendInvite("dave@partner.com");
  console.log(`  ✅ Invite sent: ${invite.inviteId}`);

  // ── Tenant C: enterprise plan ───────────────────────────────────────────
  console.log("\n════════════════ Tenant C (enterprise plan) ══════════════════");
  const tenantCContainer = createTenantContainer(
    rootContainer,
    {
      tenantId: "tenant_umbrella",
      plan: "enterprise",
      dbSchema: "umbrella",
    },
    sharedDatabasePool,
  );

  const tenantCFeatures = tenantCContainer.resolve(FeatureFlagsToken);
  console.log(
    `  Enabled flags (${tenantCFeatures.enabledFlags().length}): ${tenantCFeatures.enabledFlags().join(", ")}`,
  );

  const tenantCInviteService = tenantCContainer.resolve(InviteServiceToken);
  await tenantCInviteService.sendInvite("eve@enterprise.com");
  await tenantCInviteService.sendInvite("frank@enterprise.com");

  // ── Verify complete isolation ───────────────────────────────────────────
  console.log("\n════════════════════ Isolation verification ══════════════════");

  // Same root pool is shared — no N+1 connection overhead.
  // Use the already-resolved sharedDatabasePool (resolved earlier as async).
  const poolStats = sharedDatabasePool.stats();
  console.log(
    `  Shared pool: ${poolStats.activeConnections} active / ${poolStats.idleConnections} idle connections (shared across all ${3} tenant containers)`,
  );

  // Each tenant has its own cache namespace — writes don't bleed across tenants
  const tenantACache = tenantAContainer.resolve(TenantCacheToken);
  const tenantBCache = tenantBContainer.resolve(TenantCacheToken);
  console.log(`  Tenant A cache === Tenant B cache: ${tenantACache === tenantBCache}`); // false

  // Each tenant's UserService is a distinct instance
  const tenantAUserService2 = tenantAContainer.resolve(UserServiceToken);
  const tenantBUserService2 = tenantBContainer.resolve(UserServiceToken);
  console.log(
    `  Tenant A UserService === Tenant B UserService: ${tenantAUserService2 === tenantBUserService2}`,
  ); // false

  // Within the same tenant container, the same scoped instance is reused
  console.log(
    `  Tenant A UserService scoped identity: ${tenantAUserService === tenantAUserService2}`,
  ); // true

  // rootContainer.dispose() at scope exit fires pool.close()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
