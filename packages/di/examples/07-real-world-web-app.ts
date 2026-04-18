/**
 * Example 07 — Real-world Web App
 *
 * A complete scenario combining all features:
 * - AsyncModule for infrastructure (DB, cache)
 * - Modules for domain layers (repositories, services, controllers)
 * - Scoped child containers per HTTP request
 * - Lifecycle hooks (connect / disconnect)
 * - Named bindings for environment-specific overrides
 * - resolveAll for middleware pipeline
 * - Container validation before serving traffic
 * - Graceful shutdown with await using
 */

import { Container, inject, injectable, Module, scoped, singleton, token } from "@codefast/di";

// ============================================================================
// Domain types
// ============================================================================

interface AppConfig {
  env: "development" | "production";
  dbUrl: string;
  jwtSecret: string;
}

interface HttpRequest {
  requestId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
}

interface HttpResponse {
  status: number;
  body: unknown;
}

// ============================================================================
// Tokens
// ============================================================================

const ConfigToken = token<AppConfig>("AppConfig");
const DatabaseToken = token<Database>("Database");
const UserRepoToken = token<UserRepository>("UserRepository");
const AuthServiceToken = token<AuthService>("AuthService");
const MiddlewareToken = token<Middleware>("Middleware");
const RequestContextToken = token<HttpRequest>("RequestContext");
const UserControllerToken = token<UserController>("UserController");

// ============================================================================
// Infrastructure
// ============================================================================

class Database {
  private connected = false;

  constructor(readonly url: string) {}

  async connect(): Promise<void> {
    await tick();
    this.connected = true;
    console.log(`[DB] connected: ${this.url}`);
  }

  async disconnect(): Promise<void> {
    await tick();
    this.connected = false;
    console.log(`[DB] disconnected`);
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    await tick();
    console.log(`  [DB] ${sql}${params?.length ? ` (${params.length} params)` : ""}`);
    return [] as T[];
  }
}

// ============================================================================
// Repositories
// ============================================================================

interface User {
  id: string;
  email: string;
  role: "admin" | "user";
}

@injectable([inject(DatabaseToken)])
@singleton()
class UserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | undefined> {
    const rows = await this.db.query<User>("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ?? { id, email: `user${id}@example.com`, role: "user" };
  }
}

// ============================================================================
// Services
// ============================================================================

@injectable([inject(ConfigToken), inject(UserRepoToken)])
@singleton()
class AuthService {
  constructor(
    private readonly config: AppConfig,
    private readonly users: UserRepository,
  ) {}

  async authenticate(token: string): Promise<User | undefined> {
    const userId = token.replace("bearer-", ""); // simplified
    return this.users.findById(userId);
  }

  issueToken(userId: string): string {
    return `bearer-${userId}`;
  }
}

// ============================================================================
// Middleware pipeline (multi-binding)
// ============================================================================

interface Middleware {
  name: string;
  process(req: HttpRequest, next: () => Promise<HttpResponse>): Promise<HttpResponse>;
}

class LoggingMiddleware implements Middleware {
  name = "logging";

  async process(req: HttpRequest, next: () => Promise<HttpResponse>): Promise<HttpResponse> {
    const start = Date.now();
    console.log(`→ ${req.method} ${req.path} [${req.requestId}]`);
    const res = await next();
    console.log(`← ${res.status} (${Date.now() - start}ms) [${req.requestId}]`);
    return res;
  }
}

@injectable([inject(AuthServiceToken)])
class AuthMiddleware implements Middleware {
  name = "auth";

  constructor(private readonly auth: AuthService) {}

  async process(req: HttpRequest, next: () => Promise<HttpResponse>): Promise<HttpResponse> {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return { status: 401, body: { error: "Unauthorized" } };
    }

    const user = await this.auth.authenticate(authHeader);

    if (!user) {
      return { status: 403, body: { error: "Forbidden" } };
    }

    return next();
  }
}

// ============================================================================
// Controllers (scoped — one per request via scoped child container)
// ============================================================================

@injectable([inject(RequestContextToken), inject(UserRepoToken), inject(AuthServiceToken)])
@scoped()
class UserController {
  constructor(
    private readonly req: HttpRequest,
    private readonly users: UserRepository,
    private readonly auth: AuthService,
  ) {}

  async getProfile(): Promise<HttpResponse> {
    const token = this.req.headers["authorization"] ?? "";
    const user = await this.auth.authenticate(token);

    if (!user) {
      return { status: 401, body: { error: "Unauthorized" } };
    }

    return { status: 200, body: { user } };
  }

  issueToken(userId: string): HttpResponse {
    return { status: 200, body: { token: this.auth.issueToken(userId) } };
  }
}

// ============================================================================
// Modules
// ============================================================================

const InfraModule = Module.createAsync("Infra", async (api) => {
  const config = await loadConfig();
  api.bind(ConfigToken).toConstantValue(config);

  api
    .bind(DatabaseToken)
    .toDynamicAsync(async (ctx) => {
      const cfg = ctx.resolve(ConfigToken);
      return new Database(cfg.dbUrl);
    })
    .singleton()
    .onActivation(async (_ctx, db) => {
      await db.connect();
      return db;
    })
    .onDeactivation(async (db) => {
      await db.disconnect();
    });
});

const RepositoryModule = Module.create("Repository", (api) => {
  api.bind(UserRepoToken).to(UserRepository);
});

const ServiceModule = Module.create("Service", (api) => {
  api.import(RepositoryModule);
  api.bind(AuthServiceToken).to(AuthService);
});

const MiddlewareModule = Module.create("Middleware", (api) => {
  api.import(ServiceModule);
  // Multi-binding: register all middleware under the same token
  api.bind(MiddlewareToken).to(LoggingMiddleware);
  api.bind(MiddlewareToken).to(AuthMiddleware);
});

const ControllerModule = Module.create("Controller", (api) => {
  api.import(ServiceModule);
  api.bind(UserControllerToken).to(UserController);
});

const AppModule = Module.create("App", (api) => {
  api.import(RepositoryModule, ServiceModule, MiddlewareModule, ControllerModule);
  api.bind(RequestContextToken).toConstantValue({
    requestId: "bootstrap",
    method: "GET",
    path: "/bootstrap",
    headers: {},
  });
});

// ============================================================================
// Application server
// ============================================================================

async function createServer() {
  const container = await Container.fromModulesAsync(InfraModule, AppModule);

  // Eagerly initialize all singletons before accepting traffic
  await container.initializeAsync();

  // Validate scope rules (singleton → scoped violations, etc.)
  container.validate();
  console.log("[Server] container validated, ready to serve\n");

  async function handleRequest(req: HttpRequest): Promise<HttpResponse> {
    // Each request gets its own scoped child container
    const requestContainer = container.createChild();

    requestContainer.bind(RequestContextToken).toConstantValue(req);

    // Collect middleware pipeline
    const middlewares = requestContainer.resolveAll(MiddlewareToken);

    // Build next() chain
    const dispatch = (index: number): (() => Promise<HttpResponse>) => {
      return async () => {
        if (index >= middlewares.length) {
          // Reached end of middleware: resolve and call controller
          const controller = requestContainer.resolve(UserControllerToken);
          return controller.getProfile();
        }

        return middlewares[index]!.process(req, dispatch(index + 1));
      };
    };

    return dispatch(0)();
  }

  return { container, handleRequest };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  await using server = {
    ...(await createServer()),
    [Symbol.asyncDispose]: async function () {
      await this.container.dispose();
      console.log("\n[Server] gracefully shut down");
    },
  };

  // Simulate requests
  const res1 = await server.handleRequest({
    requestId: "req-001",
    method: "GET",
    path: "/profile",
    headers: { authorization: "bearer-42" },
  });
  console.log("Response 1:", JSON.stringify(res1));

  const res2 = await server.handleRequest({
    requestId: "req-002",
    method: "GET",
    path: "/profile",
    headers: {}, // no auth
  });
  console.log("Response 2:", JSON.stringify(res2));

  // Introspect dependency graph
  const dot = server.container.generateDependencyGraphDot();
  console.log(`\nDOT graph (${dot.split("\n").length} lines, paste at graphviz.org)`);
}

// ============================================================================
// Utilities
// ============================================================================

function tick(): Promise<void> {
  return new Promise((r) => setTimeout(r, 5));
}

async function loadConfig(): Promise<AppConfig> {
  await tick();
  return { env: "development", dbUrl: "postgres://localhost/app", jwtSecret: "dev-secret" };
}

main().catch(console.error);
