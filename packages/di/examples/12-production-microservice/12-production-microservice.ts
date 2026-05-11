/**
 * Example 12 — Production Microservice Bootstrap
 *
 * A complete, production-grade microservice lifecycle demonstrating how DI
 * transforms a tangled startup/shutdown sequence into a clean, declarative
 * dependency graph. The service exposes:
 *
 *   GET /health     — liveness + readiness checks (all deps must be healthy)
 *   POST /jobs      — enqueue a background job
 *   GET  /jobs/:id  — poll job status
 *
 * Bootstrap sequence (all async, dependencies resolved in the right order
 * automatically by the container):
 *
 *   1. Load config from environment
 *   2. Open PostgreSQL connection pool          (async, onActivation)
 *   3. Open Redis connection                    (async, onActivation)
 *   4. Start background job worker              (async, onActivation)
 *   5. Register HTTP routes                     (reads all above via tokens)
 *   6. Start HTTP server                        (onActivation)
 *   7. Validate scope rules                     (container.validate())
 *   8. Serve traffic
 *
 * Shutdown sequence (all triggered by a single container.dispose()):
 *   - Stop accepting new HTTP requests
 *   - Drain in-flight jobs
 *   - Flush job worker queue
 *   - Close Redis connection
 *   - Close PostgreSQL pool
 *
 * Without DI: a startup file of 200+ lines with explicit ordering, manual
 * null checks, and teardown spread across try/finally blocks.
 * With DI: every service declares what it needs; the container figures out
 * order, parallelises independent branches, and disposes in reverse.
 */

import { Container, Module, inject, injectable, token } from "@codefast/di";

// ============================================================================
// Tokens
// ============================================================================

const ServiceConfigToken = token<ServiceConfig>("ServiceConfig");
const DatabasePoolToken = token<DatabasePool>("DatabasePool");
const RedisClientToken = token<RedisClient>("RedisClient");
const JobQueueToken = token<JobQueue>("JobQueue");
const JobWorkerToken = token<JobWorker>("JobWorker");
const HealthRegistryToken = token<HealthRegistry>("HealthRegistry");
const HttpServerToken = token<HttpServer>("HttpServer");
const JobRepositoryToken = token<JobRepository>("JobRepository");
const JobServiceToken = token<JobService>("JobService");
const MetricsCollectorToken = token<MetricsCollector>("MetricsCollector");

// ============================================================================
// Domain types
// ============================================================================

interface ServiceConfig {
  readonly port: number;
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly workerConcurrency: number;
  readonly serviceName: string;
  readonly version: string;
}

interface HealthCheckResult {
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly latencyMs: number;
  readonly detail?: string;
}

interface HealthReport {
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly service: string;
  readonly version: string;
  readonly uptimeSeconds: number;
  readonly checks: Record<string, HealthCheckResult>;
}

interface Job {
  readonly id: string;
  readonly type: string;
  readonly payload: unknown;
  readonly status: "pending" | "running" | "completed" | "failed";
  readonly createdAt: Date;
  readonly completedAt?: Date;
  readonly error?: string;
}

// ============================================================================
// Infrastructure: DatabasePool
// ============================================================================

interface DatabasePool {
  query<T>(sql: string, params?: Array<unknown>): Promise<Array<T>>;
  healthCheck(): Promise<HealthCheckResult>;
  close(): Promise<void>;
}

class PostgresDatabasePool implements DatabasePool {
  private connected = false;
  private queryCount = 0;
  private readonly connectedAt: Date;

  constructor(
    private readonly connectionString: string,
    private readonly maxConnections: number,
  ) {
    this.connectedAt = new Date();
  }

  static async connect(
    connectionString: string,
    maxConnections: number,
  ): Promise<PostgresDatabasePool> {
    const pool = new PostgresDatabasePool(connectionString, maxConnections);
    await delay(30); // simulate connection handshake
    pool.connected = true;
    return pool;
  }

  async query<T>(sql: string, params?: Array<unknown>): Promise<Array<T>> {
    if (!this.connected) {
      throw new Error("Database pool is closed");
    }
    this.queryCount++;
    await delay(5);
    const paramInfo = params?.length ? ` [$${params.join(", $")}]` : "";
    console.log(`    [DB] query #${this.queryCount}: ${sql.slice(0, 60)}${paramInfo}`);
    return [] as Array<T>;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.connected) {
      return { status: "unhealthy", latencyMs: 0, detail: "pool closed" };
    }
    await delay(2);
    return { status: "healthy", latencyMs: Date.now() - start };
  }

  async close(): Promise<void> {
    await delay(20);
    this.connected = false;
    console.log(`    [DB] pool closed after ${this.queryCount} queries`);
  }
}

// ============================================================================
// Infrastructure: RedisClient
// ============================================================================

interface RedisClient {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, exSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
  quit(): Promise<void>;
}

class StubRedisClient implements RedisClient {
  private connected = true;
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();
  private readonly url: string;

  private constructor(url: string) {
    this.url = url;
  }

  static async connect(redisUrl: string): Promise<StubRedisClient> {
    await delay(15);
    const client = new StubRedisClient(redisUrl);
    console.log(`    [Redis] connected to ${client.url}`);
    return client;
  }

  async get(key: string): Promise<string | undefined> {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    this.store.set(
      key,
      exSeconds !== undefined ? { value, expiresAt: Date.now() + exSeconds * 1000 } : { value },
    );
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.connected) {
      return { status: "unhealthy", latencyMs: 0, detail: "disconnected" };
    }
    await delay(1);
    return { status: "healthy", latencyMs: Date.now() - start };
  }

  async quit(): Promise<void> {
    this.connected = false;
    console.log("    [Redis] connection closed");
  }
}

// ============================================================================
// Infrastructure: JobQueue + JobWorker
// ============================================================================

interface JobQueue {
  enqueue(type: string, payload: unknown): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  size(): number;
}

interface JobWorker {
  start(): void;
  stop(): Promise<void>;
  processedCount(): number;
}

type JobHandler = (job: Job) => Promise<void>;

class InMemoryJobQueue implements JobQueue {
  private readonly jobs = new Map<string, Job>();
  private readonly pending: Array<Job> = [];
  private readonly handlers = new Map<string, JobHandler>();

  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  async enqueue(type: string, payload: unknown): Promise<Job> {
    const job: Job = {
      id: `job_${Math.random().toString(36).slice(2, 10)}`,
      type,
      payload,
      status: "pending",
      createdAt: new Date(),
    };
    this.jobs.set(job.id, job);
    this.pending.push(job);
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  size(): number {
    return this.pending.length;
  }

  dequeue(): Job | undefined {
    return this.pending.shift();
  }

  updateJob(id: string, updates: Partial<Job>): void {
    const existingJob = this.jobs.get(id);
    if (existingJob) {
      this.jobs.set(id, { ...existingJob, ...updates });
    }
  }
}

class PollingJobWorker implements JobWorker {
  private running = false;
  private processed = 0;
  private pollingInterval: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly queue: InMemoryJobQueue,
    private readonly concurrency: number,
  ) {}

  start(): void {
    this.running = true;
    this.pollingInterval = setInterval(() => {
      void this.poll();
    }, 50);
    console.log(`    [Worker] started (concurrency: ${this.concurrency})`);
  }

  private async poll(): Promise<void> {
    if (!this.running) {
      return;
    }
    const job = this.queue.dequeue();
    if (!job) {
      return;
    }

    this.queue.updateJob(job.id, { status: "running" });
    try {
      await delay(20); // simulate job processing
      this.queue.updateJob(job.id, { status: "completed", completedAt: new Date() });
      this.processed++;
      console.log(`    [Worker] completed job ${job.id} (type: ${job.type})`);
    } catch (err) {
      this.queue.updateJob(job.id, {
        status: "failed",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    // Drain remaining jobs
    while (this.queue.size() > 0) {
      await this.poll();
    }
    console.log(`    [Worker] stopped after processing ${this.processed} jobs`);
  }

  processedCount(): number {
    return this.processed;
  }
}

// ============================================================================
// Infrastructure: HealthRegistry
// ============================================================================

interface HealthRegistry {
  register(name: string, check: () => Promise<HealthCheckResult>): void;
  runChecks(): Promise<HealthReport>;
}

class ServiceHealthRegistry implements HealthRegistry {
  private readonly checks = new Map<string, () => Promise<HealthCheckResult>>();
  private readonly startedAt = Date.now();

  constructor(private readonly config: ServiceConfig) {}

  register(name: string, check: () => Promise<HealthCheckResult>): void {
    this.checks.set(name, check);
  }

  async runChecks(): Promise<HealthReport> {
    const results: Record<string, HealthCheckResult> = {};
    await Promise.all(
      Array.from(this.checks.entries()).map(async ([name, check]) => {
        results[name] = await check();
      }),
    );

    const statuses = Object.values(results).map((check) => check.status);
    const overallStatus = statuses.includes("unhealthy")
      ? "unhealthy"
      : statuses.includes("degraded")
        ? "degraded"
        : "healthy";

    return {
      status: overallStatus,
      service: this.config.serviceName,
      version: this.config.version,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      checks: results,
    };
  }
}

// ============================================================================
// Infrastructure: HttpServer (simplified)
// ============================================================================

interface HttpServer {
  addRoute(
    method: string,
    path: string,
    handler: (req: MockRequest) => Promise<MockResponse>,
  ): void;
  handle(method: string, path: string, body?: unknown): Promise<MockResponse>;
  start(): void;
  stop(): Promise<void>;
}

interface MockRequest {
  method: string;
  path: string;
  body?: unknown;
  params: Record<string, string>;
}

interface MockResponse {
  status: number;
  body: unknown;
}

class MockHttpServer implements HttpServer {
  private readonly routes = new Map<string, (req: MockRequest) => Promise<MockResponse>>();
  private running = false;

  addRoute(
    method: string,
    path: string,
    handler: (req: MockRequest) => Promise<MockResponse>,
  ): void {
    this.routes.set(`${method} ${path}`, handler);
  }

  async handle(method: string, path: string, body?: unknown): Promise<MockResponse> {
    // exact match first, then parameterised match
    const exactHandler = this.routes.get(`${method} ${path}`);
    if (exactHandler) {
      return exactHandler({ method, path, body, params: {} });
    }

    for (const [routeKey, routeHandler] of this.routes) {
      // Use space as separator — colon is reserved for :param segments
      const spaceIndex = routeKey.indexOf(" ");
      const routeMethod = routeKey.slice(0, spaceIndex);
      const routePath = routeKey.slice(spaceIndex + 1);
      if (routeMethod !== method) {
        continue;
      }
      const params = matchRoute(routePath, path);
      if (params) {
        return routeHandler({ method, path, body, params });
      }
    }

    return { status: 404, body: { error: "Not Found" } };
  }

  start(): void {
    this.running = true;
    console.log(`    [HTTP] server listening (mock)`);
  }

  async stop(): Promise<void> {
    this.running = false;
    await delay(10);
    console.log("    [HTTP] server stopped");
  }
}

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i] ?? "";
    const pathPart = pathParts[i] ?? "";
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
}

// ============================================================================
// Metrics collector
// ============================================================================

interface MetricsCollector {
  increment(metric: string, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  summary(): Record<string, number>;
}

class InMemoryMetricsCollector implements MetricsCollector {
  private readonly counters = new Map<string, number>();

  increment(metric: string, tags?: Record<string, string>): void {
    const key = tags
      ? `${metric}{${Object.entries(tags)
          .map(([k, v]) => `${k}="${v}"`)
          .join(",")}}`
      : metric;
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  gauge(metric: string, value: number): void {
    this.counters.set(metric, value);
  }

  summary(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}

// ============================================================================
// Domain: JobRepository + JobService
// ============================================================================

interface JobRepository {
  create(type: string, payload: unknown): Promise<Job>;
  findById(id: string): Promise<Job | undefined>;
}

@injectable([inject(JobQueueToken), inject(RedisClientToken)])
class JobQueueBackedRepository implements JobRepository {
  constructor(
    private readonly queue: JobQueue,
    private readonly redisClient: RedisClient,
  ) {}

  async create(type: string, payload: unknown): Promise<Job> {
    const job = await this.queue.enqueue(type, payload);
    await this.redisClient.set(`job:${job.id}`, JSON.stringify(job), 3600);
    return job;
  }

  async findById(id: string): Promise<Job | undefined> {
    // Queue is the live source of truth — worker updates happen here in real time.
    // Redis holds only the initial snapshot; checking it first would return stale status.
    const liveJob = await this.queue.getJob(id);
    if (liveJob) {
      return liveJob;
    }
    // Fall back to Redis for jobs that have been evicted from memory.
    const cached = await this.redisClient.get(`job:${id}`);
    if (cached) {
      return JSON.parse(cached) as Job;
    }
    return undefined;
  }
}

interface JobService {
  enqueueEmailJob(to: string, subject: string, body: string): Promise<Job>;
  enqueueReportJob(reportType: string, params: Record<string, unknown>): Promise<Job>;
  getJobStatus(id: string): Promise<Job | undefined>;
}

@injectable([inject(JobRepositoryToken), inject(MetricsCollectorToken), inject(DatabasePoolToken)])
class JobManager implements JobService {
  constructor(
    private readonly repository: JobRepository,
    private readonly metrics: MetricsCollector,
    private readonly databasePool: DatabasePool,
  ) {}

  async enqueueEmailJob(to: string, subject: string, body: string): Promise<Job> {
    const job = await this.repository.create("send_email", { to, subject, body });
    this.metrics.increment("jobs.enqueued", { type: "send_email" });

    await this.databasePool.query(
      "INSERT INTO job_audit (job_id, type, enqueued_at) VALUES ($1, $2, $3)",
      [job.id, job.type, job.createdAt.toISOString()],
    );

    console.log(`    [JobService] enqueued email job ${job.id} → ${to}`);
    return job;
  }

  async enqueueReportJob(reportType: string, params: Record<string, unknown>): Promise<Job> {
    const job = await this.repository.create("generate_report", { reportType, params });
    this.metrics.increment("jobs.enqueued", { type: "generate_report" });
    console.log(`    [JobService] enqueued report job ${job.id} (${reportType})`);
    return job;
  }

  async getJobStatus(id: string): Promise<Job | undefined> {
    return this.repository.findById(id);
  }
}

// ============================================================================
// Modules
// ============================================================================

const ConfigModule = Module.createAsync("Config", async (builder) => {
  // In production, read from process.env / secrets manager
  builder.bind(ServiceConfigToken).toConstantValue({
    port: 3000,
    databaseUrl: "postgres://localhost:5432/jobservice",
    redisUrl: "redis://localhost:6379",
    workerConcurrency: 4,
    serviceName: "job-service",
    version: "1.5.0",
  });
});

const DatabaseModule = Module.createAsync("Database", async (builder) => {
  builder.import(ConfigModule);

  builder
    .bind(DatabasePoolToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(ServiceConfigToken);
      console.log("    [DB] connecting...");
      const pool = await PostgresDatabasePool.connect(config.databaseUrl, 20);
      console.log("    [DB] connected ✓");
      return pool;
    })
    .singleton()
    .onDeactivation(async (pool) => {
      await (pool as PostgresDatabasePool).close();
    });
});

const RedisModule = Module.createAsync("Redis", async (builder) => {
  builder.import(ConfigModule);

  builder
    .bind(RedisClientToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(ServiceConfigToken);
      console.log("    [Redis] connecting...");
      const client = await StubRedisClient.connect(config.redisUrl);
      console.log("    [Redis] connected ✓");
      return client;
    })
    .singleton()
    .onDeactivation(async (client) => {
      await client.quit();
    });
});

const WorkerModule = Module.createAsync("Worker", async (builder) => {
  builder.import(ConfigModule);

  builder
    .bind(JobQueueToken)
    .toDynamic(() => new InMemoryJobQueue())
    .singleton();

  builder
    .bind(JobWorkerToken)
    .toDynamic((ctx) => {
      const config = ctx.resolve(ServiceConfigToken);
      const queue = ctx.resolve(JobQueueToken) as InMemoryJobQueue;
      return new PollingJobWorker(queue, config.workerConcurrency);
    })
    .singleton()
    .onActivation((_ctx, worker) => {
      worker.start();
      return worker;
    })
    .onDeactivation(async (worker) => {
      await worker.stop();
    });
});

const MetricsModule = Module.create("Metrics", (builder) => {
  builder
    .bind(MetricsCollectorToken)
    .toDynamic(() => new InMemoryMetricsCollector())
    .singleton();
});

// HealthModule imports async modules → must be async itself
const HealthModule = Module.createAsync("Health", async (builder) => {
  builder.import(ConfigModule);

  // DatabasePool and RedisClient have async factories — use toDynamicAsync
  // and resolveAsync so the sync resolver is never called on async bindings.
  builder
    .bind(HealthRegistryToken)
    .toDynamicAsync(async (ctx) => {
      const config = ctx.resolve(ServiceConfigToken);
      const registry = new ServiceHealthRegistry(config);

      // Resolve async infrastructure deps via resolveAsync
      const databasePool = await ctx.resolveAsync(DatabasePoolToken);
      const redisClient = await ctx.resolveAsync(RedisClientToken);

      registry.register("database", () => databasePool.healthCheck());
      registry.register("redis", () => redisClient.healthCheck());
      registry.register("worker", async () => {
        const worker = ctx.resolve(JobWorkerToken);
        const queue = ctx.resolve(JobQueueToken);
        return {
          status: "healthy",
          latencyMs: 0,
          detail: `processed=${worker.processedCount()} queued=${queue.size()}`,
        };
      });

      return registry;
    })
    .singleton();
});

// HttpModule imports async modules → must be async itself
const HttpModule = Module.createAsync("Http", async (builder) => {
  builder.import(ConfigModule, HealthModule);

  // HealthRegistry is toDynamicAsync → HttpServer must also use toDynamicAsync
  // and resolve its async deps via resolveAsync before wiring routes.
  builder
    .bind(HttpServerToken)
    .toDynamicAsync(async (ctx) => {
      const healthRegistry = await ctx.resolveAsync(HealthRegistryToken);
      const jobService = await ctx.resolveAsync(JobServiceToken);
      const server = new MockHttpServer();

      // GET /health
      server.addRoute("GET", "/health", async () => {
        const report = await healthRegistry.runChecks();
        return {
          status: report.status === "healthy" ? 200 : report.status === "degraded" ? 207 : 503,
          body: report,
        };
      });

      // POST /jobs
      server.addRoute("POST", "/jobs", async (req) => {
        const { type, payload } = req.body as { type: string; payload: Record<string, unknown> };
        let job: Job;
        if (type === "send_email") {
          const emailPayload = payload as { to: string; subject: string; body: string };
          job = await jobService.enqueueEmailJob(
            emailPayload.to,
            emailPayload.subject,
            emailPayload.body,
          );
        } else {
          job = await jobService.enqueueReportJob(type, payload);
        }
        return { status: 202, body: { jobId: job.id, status: job.status } };
      });

      // GET /jobs/:id
      server.addRoute("GET", "/jobs/:id", async (req) => {
        const jobId = req.params["id"] ?? "";
        const jobRecord = await jobService.getJobStatus(jobId);
        if (!jobRecord) {
          return { status: 404, body: { error: "Job not found" } };
        }
        return { status: 200, body: jobRecord };
      });

      return server;
    })
    .singleton()
    .onActivation((_ctx, server) => {
      server.start();
      return server;
    })
    .onDeactivation(async (server) => {
      await server.stop();
    });
});

// ServiceModule imports async modules → must be async itself
const ServiceModule = Module.createAsync("Service", async (builder) => {
  builder.import(DatabaseModule, RedisModule, MetricsModule);
  builder.bind(JobRepositoryToken).to(JobQueueBackedRepository).singleton();
  builder.bind(JobServiceToken).to(JobManager).singleton();
});

// AppModule composes everything — async because it imports async modules
const AppModule = Module.createAsync("App", async (builder) => {
  builder.import(
    ConfigModule,
    DatabaseModule,
    RedisModule,
    WorkerModule,
    MetricsModule,
    HealthModule,
    ServiceModule,
    HttpModule,
  );
});

// ============================================================================
// Bootstrap
// ============================================================================

async function bootstrap(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🏗  Bootstrapping job-service v1.5.0");
  console.log("═══════════════════════════════════════════════════════════\n");

  // await using: container.dispose() fires automatically when main() returns
  await using serviceContainer = await Container.fromModulesAsync(AppModule);

  // Eager init: resolve all singletons now, fail fast before binding port
  console.log("  Initialising infrastructure...");
  await serviceContainer.initializeAsync();

  // Validate scope rules — no captive dependencies
  serviceContainer.validate();

  // HttpServer is toDynamicAsync (depends on async HealthRegistry) → resolveAsync
  const httpServer = await serviceContainer.resolveAsync(HttpServerToken);
  const metricsCollector = serviceContainer.resolve(MetricsCollectorToken);

  console.log("\n  ✅ Service ready — simulating traffic\n");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── GET /health ─────────────────────────────────────────────────────────
  console.log("  → GET /health");
  const healthResponse = await httpServer.handle("GET", "/health");
  const healthReport = healthResponse.body as HealthReport;
  console.log(
    `  ← ${healthResponse.status} status=${healthReport.status} uptime=${healthReport.uptimeSeconds}s`,
  );
  console.log(
    "     checks:",
    Object.entries(healthReport.checks)
      .map(([name, check]) => `${name}=${check.status}(${check.latencyMs}ms)`)
      .join("  "),
  );

  // ── POST /jobs (enqueue email) ───────────────────────────────────────────
  console.log("\n  → POST /jobs (send_email)");
  const emailJobResponse = await httpServer.handle("POST", "/jobs", {
    type: "send_email",
    payload: {
      to: "ceo@example.com",
      subject: "Monthly Report",
      body: "Please find attached the monthly report.",
    },
  });
  const emailJobResult = emailJobResponse.body as { jobId: string; status: string };
  console.log(
    `  ← ${emailJobResponse.status} jobId=${emailJobResult.jobId} status=${emailJobResult.status}`,
  );

  // ── POST /jobs (generate report) ────────────────────────────────────────
  console.log("\n  → POST /jobs (generate_report)");
  const reportJobResponse = await httpServer.handle("POST", "/jobs", {
    type: "generate_report",
    payload: { reportType: "revenue", params: { month: "2026-04", currency: "USD" } },
  });
  const reportJobResult = reportJobResponse.body as { jobId: string; status: string };
  console.log(
    `  ← ${reportJobResponse.status} jobId=${reportJobResult.jobId} status=${reportJobResult.status}`,
  );

  // Wait for worker to process jobs
  await delay(150);

  // ── GET /jobs/:id ────────────────────────────────────────────────────────
  console.log(`\n  → GET /jobs/${emailJobResult.jobId}`);
  const jobStatusResponse = await httpServer.handle("GET", `/jobs/${emailJobResult.jobId}`);
  const jobStatus = jobStatusResponse.body as Job;
  console.log(
    `  ← ${jobStatusResponse.status} status=${jobStatus.status} completedAt=${jobStatus.completedAt?.toISOString() ?? "pending"}`,
  );

  // ── Metrics summary ──────────────────────────────────────────────────────
  console.log("\n  📊 Metrics summary:");
  const metricsSummary = metricsCollector.summary();
  Object.entries(metricsSummary).forEach(([metricKey, metricValue]) => {
    console.log(`     ${metricKey}: ${metricValue}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  🛑 Initiating graceful shutdown...");
  console.log("═══════════════════════════════════════════════════════════");
  // container.dispose() called automatically by `await using`:
  // Deactivation order (reverse of activation):
  //   HttpServer.stop() → JobWorker.stop() → Redis.quit() → Database.close()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

bootstrap().catch(console.error);
