/**
 * Example 02 — Decorators
 *
 * TC39 Stage 3 decorators (no reflect-metadata needed).
 * Shows @injectable, @singleton, @scoped, inject(), and optional().
 */

import { Container, inject, injectable, optional, singleton, token } from "@codefast/di";

// --- Tokens -----------------------------------------------------------------

const ConfigToken = token<AppConfig>("AppConfig");
const CacheToken = token<Cache>("Cache");
const LoggerToken = token<Logger>("Logger");
const UserServiceToken = token<UserService>("UserService");

// --- Types ------------------------------------------------------------------

interface AppConfig {
  dbUrl: string;
  debug: boolean;
}

interface Cache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

interface Logger {
  log(msg: string): void;
}

// --- Implementations --------------------------------------------------------

// @injectable declares constructor dependencies in order.
// inject() marks a required dependency; optional() marks optional.
@injectable([inject(ConfigToken), optional(LoggerToken)])
@singleton()
class Database {
  readonly url: string;

  constructor(config: AppConfig, logger?: Logger) {
    this.url = config.dbUrl;
    logger?.log(`Database connected to ${config.dbUrl}`);
  }
}

// @singleton() hint — container respects this when using .toSelf()
@injectable([inject(ConfigToken)])
@singleton()
class InMemoryCache implements Cache {
  private readonly store = new Map<string, string>();

  constructor(config: AppConfig) {
    if (config.debug) {
      console.log("[Cache] initialized");
    }
  }

  get(key: string): string | undefined {
    return this.store.get(key);
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
  }
}

// Multiple required dependencies
@injectable([inject(Database), inject(CacheToken), optional(LoggerToken)])
class UserService {
  constructor(
    private readonly db: Database,
    private readonly cache: Cache,
    private readonly logger?: Logger,
  ) {}

  findUser(id: string): string {
    const cached = this.cache.get(id);

    if (cached) {
      this.logger?.log(`[UserService] cache hit for ${id}`);
      return cached;
    }

    const user = `User(${id}) from ${this.db.url}`;
    this.cache.set(id, user);
    this.logger?.log(`[UserService] loaded ${id} from db`);
    return user;
  }
}

// --- Container setup --------------------------------------------------------

const container = Container.create();

container.bind(ConfigToken).toConstantValue({ dbUrl: "postgres://localhost/app", debug: true });
container.bind(LoggerToken).toConstantValue({ log: (msg) => console.log(msg) });

// .toSelf() reads @singleton / @injectable metadata from the class
container.bind(Database).toSelf();
container.bind(CacheToken).to(InMemoryCache); // reads @injectable + @singleton
container.bind(UserServiceToken).to(UserService);

// --- Usage ------------------------------------------------------------------

const svc = container.resolve(UserServiceToken);

console.log(svc.findUser("42")); // loads from db
console.log(svc.findUser("42")); // cache hit

// Verify @singleton — same Database instance across resolutions
const firstDatabaseResolve = container.resolve(Database);
const secondDatabaseResolve = container.resolve(Database);
console.log("Same Database singleton:", firstDatabaseResolve === secondDatabaseResolve); // true
