/**
 * Example 14 — Auto-Register Registry
 *
 * Shows how to use createAutoRegisterRegistry + @injectable autoRegister option
 * to bulk-register decorated classes without calling container.bind() manually.
 *
 * Pattern:
 *   1. Create a registry (one per layer or one global).
 *   2. Decorate each class with @injectable([...], { autoRegister: registry, scope }).
 *   3. Call container.loadAutoRegistered(registry) once at bootstrap — the container
 *      binds every registered class in the order they were decorated.
 *
 * This eliminates the verbosity of a long list of container.bind().to().singleton()
 * calls when a large number of services share the same wiring strategy.
 */

import {
  Container,
  createAutoRegisterRegistry,
  inject,
  injectable,
  token,
  type AutoRegisterRegistry,
} from "@codefast/di";

// ── Tokens ───────────────────────────────────────────────────────────────────

const LoggerToken = token<Logger>("Logger");
const ConfigToken = token<Config>("Config");
const DatabaseToken = token<Database>("Database");
const UserRepositoryToken = token<UserRepository>("UserRepository");
const OrderRepositoryToken = token<OrderRepository>("OrderRepository");
const UserServiceToken = token<UserService>("UserService");
const OrderServiceToken = token<OrderService>("OrderService");
const NotificationServiceToken = token<NotificationService>("NotificationService");

// ── Interfaces ───────────────────────────────────────────────────────────────

interface Logger {
  log(msg: string): void;
  warn(msg: string): void;
}

interface Config {
  dbUrl: string;
  appName: string;
}

interface Database {
  query(sql: string): Array<string>;
}

interface UserRepository {
  findById(id: string): { id: string; name: string } | undefined;
  save(user: { id: string; name: string }): void;
}

interface OrderRepository {
  findByUserId(userId: string): Array<{ id: string; userId: string; total: number }>;
  save(order: { id: string; userId: string; total: number }): void;
}

interface UserService {
  getUser(id: string): { id: string; name: string } | undefined;
  createUser(id: string, name: string): void;
}

interface OrderService {
  getUserOrders(userId: string): Array<{ id: string; userId: string; total: number }>;
  placeOrder(userId: string, total: number): void;
}

interface NotificationService {
  send(to: string, message: string): void;
}

// ── Registries ───────────────────────────────────────────────────────────────
//
// Separate registries per architectural layer keep concerns isolated.
// You can also use a single global registry — pick what fits your project.

const infrastructureRegistry: AutoRegisterRegistry = createAutoRegisterRegistry();
const domainRegistry: AutoRegisterRegistry = createAutoRegisterRegistry();
const applicationRegistry: AutoRegisterRegistry = createAutoRegisterRegistry();

// ── Infrastructure layer ──────────────────────────────────────────────────────
//
// These are heavy resources — singletons so they are created once.

// ConsoleLogger has no dependencies, so the deps array is empty.
@injectable([], { autoRegister: infrastructureRegistry, scope: "singleton" })
class ConsoleLogger implements Logger {
  log(msg: string): void {
    console.log(`[LOG]  ${msg}`);
  }

  warn(msg: string): void {
    console.warn(`[WARN] ${msg}`);
  }
}

// AppConfig has no dependencies either.
@injectable([], { autoRegister: infrastructureRegistry, scope: "singleton" })
class AppConfig implements Config {
  readonly dbUrl = "postgres://localhost/myapp";
  readonly appName = "MyApp";
}

@injectable([inject(LoggerToken), inject(ConfigToken)], {
  autoRegister: infrastructureRegistry,
  scope: "singleton",
})
class PostgresDatabase implements Database {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
  ) {
    logger.log(`Database connected to ${config.dbUrl}`);
  }

  query(sql: string): Array<string> {
    this.logger.log(`Executing: ${sql}`);
    return [`row-from-${sql}`];
  }
}

// ── Domain layer ─────────────────────────────────────────────────────────────

@injectable([inject(DatabaseToken)], { autoRegister: domainRegistry, scope: "singleton" })
class SqlUserRepository implements UserRepository {
  private readonly users = new Map<string, { id: string; name: string }>();

  constructor(private readonly db: Database) {}

  findById(id: string): { id: string; name: string } | undefined {
    this.db.query(`SELECT * FROM users WHERE id = '${id}'`);
    return this.users.get(id);
  }

  save(user: { id: string; name: string }): void {
    this.db.query(`INSERT INTO users VALUES ('${user.id}', '${user.name}')`);
    this.users.set(user.id, user);
  }
}

@injectable([inject(DatabaseToken)], { autoRegister: domainRegistry, scope: "singleton" })
class SqlOrderRepository implements OrderRepository {
  private readonly orders: Array<{ id: string; userId: string; total: number }> = [];

  constructor(private readonly db: Database) {}

  findByUserId(userId: string): Array<{ id: string; userId: string; total: number }> {
    this.db.query(`SELECT * FROM orders WHERE user_id = '${userId}'`);
    return this.orders.filter((order) => order.userId === userId);
  }

  save(order: { id: string; userId: string; total: number }): void {
    this.db.query(`INSERT INTO orders VALUES ('${order.id}', '${order.userId}', ${order.total})`);
    this.orders.push(order);
  }
}

// ── Application layer ─────────────────────────────────────────────────────────

@injectable([inject(UserRepositoryToken), inject(LoggerToken)], {
  autoRegister: applicationRegistry,
  scope: "singleton",
})
class UserManager implements UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  getUser(id: string): { id: string; name: string } | undefined {
    this.logger.log(`Getting user ${id}`);
    return this.userRepository.findById(id);
  }

  createUser(id: string, name: string): void {
    this.logger.log(`Creating user ${id} (${name})`);
    this.userRepository.save({ id, name });
  }
}

@injectable(
  [inject(OrderRepositoryToken), inject(UserServiceToken), inject(NotificationServiceToken)],
  { autoRegister: applicationRegistry, scope: "singleton" },
)
class OrderProcessor implements OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  getUserOrders(userId: string): Array<{ id: string; userId: string; total: number }> {
    return this.orderRepository.findByUserId(userId);
  }

  placeOrder(userId: string, total: number): void {
    const user = this.userService.getUser(userId);
    if (user === undefined) {
      throw new Error(`User ${userId} not found`);
    }
    const order = { id: `ord-${Date.now()}`, userId, total };
    this.orderRepository.save(order);
    this.notificationService.send(userId, `Order placed: $${total}`);
  }
}

@injectable([inject(LoggerToken)], { autoRegister: applicationRegistry, scope: "singleton" })
class EmailNotificationService implements NotificationService {
  constructor(private readonly logger: Logger) {}

  send(to: string, message: string): void {
    this.logger.log(`Email → ${to}: ${message}`);
  }
}

// ── Token wiring map ──────────────────────────────────────────────────────────
//
// loadAutoRegistered binds each Constructor to its token using Constructor itself
// as the token. Since our tokens are symbol-based (not the class itself), we must
// bind the interface token → the concrete class explicitly, or use the class
// constructor as the token directly.
//
// Strategy A (used here): loadAutoRegistered + manual token alias bindings.
// Strategy B: use the class constructor as the token everywhere (skips aliases).

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const container = Container.create();

// Bind the stable infrastructure values that auto-register cannot produce
// (these are plain values, not classes).
container.bind(ConfigToken).to(AppConfig).singleton();
container.bind(LoggerToken).to(ConsoleLogger).singleton();
container.bind(DatabaseToken).to(PostgresDatabase).singleton();

// loadAutoRegistered: binds each entry as `container.bind(Constructor).to(Constructor).scope()`
// The returned number is how many bindings were added.
const infraCount = container.loadAutoRegistered(infrastructureRegistry);
const domainCount = container.loadAutoRegistered(domainRegistry);
const appCount = container.loadAutoRegistered(applicationRegistry);

console.log(`Auto-registered: ${infraCount} infra + ${domainCount} domain + ${appCount} app`);

// Alias interface tokens → concrete singletons (already bound by loadAutoRegistered).
container.bind(UserRepositoryToken).to(SqlUserRepository).singleton();
container.bind(OrderRepositoryToken).to(SqlOrderRepository).singleton();
container.bind(UserServiceToken).to(UserManager).singleton();
container.bind(OrderServiceToken).to(OrderProcessor).singleton();
container.bind(NotificationServiceToken).to(EmailNotificationService).singleton();

// ── Usage ─────────────────────────────────────────────────────────────────────

console.log("\n=== Bootstrapped via auto-register ===");

const userService = container.resolve(UserServiceToken);
userService.createUser("u1", "Alice");
userService.createUser("u2", "Bob");

const orderService = container.resolve(OrderServiceToken);
orderService.placeOrder("u1", 99.99);
orderService.placeOrder("u2", 45.0);

console.log("\n=== Querying ===");
const aliceOrders = orderService.getUserOrders("u1");
console.log(`Alice has ${aliceOrders.length} order(s)`);

// ── Inspect the registry entries ──────────────────────────────────────────────

console.log("\n=== Registry entries ===");
console.log(
  "Infrastructure:",
  infrastructureRegistry.entries().map((entry) => `${entry.target.name}(${entry.scope})`),
);
console.log(
  "Domain:",
  domainRegistry.entries().map((entry) => `${entry.target.name}(${entry.scope})`),
);
console.log(
  "Application:",
  applicationRegistry.entries().map((entry) => `${entry.target.name}(${entry.scope})`),
);

// ── Conditional registration ──────────────────────────────────────────────────
//
// A common pattern: register different implementations based on environment.
// Because registration happens at decorator-application time (module load), use
// separate registries per environment and select one at bootstrap.

const devRegistry: AutoRegisterRegistry = createAutoRegisterRegistry();
const prodRegistry: AutoRegisterRegistry = createAutoRegisterRegistry();

@injectable([], { autoRegister: devRegistry, scope: "singleton" })
class DevNotificationService implements NotificationService {
  send(to: string, message: string): void {
    console.log(`[STUB] Would email ${to}: ${message}`);
  }
}

@injectable([inject(LoggerToken)], { autoRegister: prodRegistry, scope: "singleton" })
class ProdNotificationService implements NotificationService {
  constructor(private readonly logger: Logger) {}

  send(to: string, message: string): void {
    this.logger.log(`SMS → ${to}: ${message}`);
  }
}

const isProduction = false; // process.env.NODE_ENV === "production"
const envRegistry = isProduction ? prodRegistry : devRegistry;

const envContainer = Container.create();
envContainer.bind(LoggerToken).to(ConsoleLogger).singleton();
envContainer.loadAutoRegistered(envRegistry);

// Bind the interface token to whichever concrete class was auto-registered.
const NotificationImpl = isProduction ? ProdNotificationService : DevNotificationService;
envContainer.bind(NotificationServiceToken).to(NotificationImpl).singleton();

console.log("\n=== Conditional (env-based) registry ===");
console.log(
  "Env registry entries:",
  envRegistry.entries().map((e) => `${e.target.name}`),
);

const envNotifier = envContainer.resolve(NotificationServiceToken);
envNotifier.send("ops@example.com", "App started");
