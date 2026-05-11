/**
 * Example 15 — Container Inspection & Graph Visualization
 *
 * Shows how to use the introspection API to understand and visualize a running
 * container — useful for debugging, architecture audits, and developer tooling.
 *
 * Covers:
 * - container.inspect()        → ContainerSnapshot (binding list + cache counts)
 * - container.lookupBindings() → BindingSnapshot[] for a specific token
 * - container.has() / hasOwn() → existence checks with optional hints
 * - container.generateDependencyGraph() → ContainerGraphJson
 * - toDotGraph()               → Graphviz DOT string (paste into graphviz.online)
 * - toCytoscapeGraph()         → Cytoscape.js elements (drop into a browser app)
 */

import { Container, inject, injectable, Module, token, tokenName } from "@codefast/di";
import { toDotGraph } from "@codefast/di/graph-adapters/dot";
import { toCytoscapeGraph } from "@codefast/di/graph-adapters/cytoscape";

// ── Tokens ───────────────────────────────────────────────────────────────────

const LoggerToken = token<Logger>("Logger");
const ConfigToken = token<Config>("Config");
const CacheToken = token<Cache>("Cache");
const DatabaseToken = token<Database>("Database");
const UserServiceToken = token<UserService>("UserService");
const AnalyticsToken = token<Analytics>("Analytics");

// ── Interfaces ───────────────────────────────────────────────────────────────

interface Logger {
  log(msg: string): void;
}

interface Config {
  dbUrl: string;
  env: "development" | "production";
}

interface Cache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

interface Database {
  query(sql: string): Array<string>;
}

interface UserService {
  getUser(id: string): string;
}

interface Analytics {
  track(event: string): void;
}

// ── Implementations ───────────────────────────────────────────────────────────

@injectable([])
class ConsoleLogger implements Logger {
  log(msg: string): void {
    console.log(`[log] ${msg}`);
  }
}

@injectable([inject(LoggerToken), inject(ConfigToken)])
class PostgresDatabase implements Database {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  query(sql: string): Array<string> {
    this.logger.log(`Query on ${this.config.dbUrl}: ${sql}`);
    return [];
  }
}

@injectable([inject(LoggerToken)])
class RedisCache implements Cache {
  private readonly store = new Map<string, string>();

  constructor(private readonly logger: Logger) {}

  get(key: string): string | undefined {
    return this.store.get(key);
  }

  set(key: string, value: string): void {
    this.logger.log(`Cache set: ${key}`);
    this.store.set(key, value);
  }
}

@injectable([inject(DatabaseToken), inject(CacheToken)])
class UserManager implements UserService {
  constructor(
    private readonly db: Database,
    private readonly cache: Cache,
  ) {}

  getUser(id: string): string {
    const cached = this.cache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    this.db.query(`SELECT name FROM users WHERE id = '${id}'`);
    return `User(${id})`;
  }
}

@injectable([inject(LoggerToken)])
class SegmentAnalytics implements Analytics {
  constructor(private readonly logger: Logger) {}

  track(event: string): void {
    this.logger.log(`[analytics] ${event}`);
  }
}

// ── Modules ───────────────────────────────────────────────────────────────────

const InfraModule = Module.create("Infra", (builder) => {
  builder.bind(LoggerToken).to(ConsoleLogger).singleton();
  builder
    .bind(ConfigToken)
    .toConstantValue({ dbUrl: "postgres://localhost/app", env: "development" });
  builder.bind(CacheToken).to(RedisCache).singleton();
  builder.bind(DatabaseToken).to(PostgresDatabase).singleton();
});

const AppModule = Module.create("App", (builder) => {
  builder.bind(UserServiceToken).to(UserManager).singleton();
  builder.bind(AnalyticsToken).to(SegmentAnalytics).singleton();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const container = Container.fromModules(InfraModule, AppModule);

// Trigger resolution so singletons are cached (inspection shows cache counts).
container.resolve(UserServiceToken);
container.resolve(AnalyticsToken);

// ─────────────────────────────────────────────────────────────────────────────
// 1. container.inspect() — full snapshot of the container state
// ─────────────────────────────────────────────────────────────────────────────

console.log("=== ContainerSnapshot ===");
const snapshot = container.inspect();

console.log("hasParent:           ", snapshot.hasParent);
console.log("isDisposed:          ", snapshot.isDisposed);
console.log("cachedSingletonCount:", snapshot.cachedSingletonCount);
console.log("ownBindings count:   ", snapshot.ownBindings.length);

console.log("\n--- All bindings ---");
for (const binding of snapshot.ownBindings) {
  const slotInfo =
    binding.slot.name !== undefined
      ? ` name="${binding.slot.name}"`
      : binding.slot.tags.length > 0
        ? ` tags=${JSON.stringify(binding.slot.tags)}`
        : "";
  console.log(
    `  ${binding.tokenName.padEnd(16)} kind=${binding.kind.padEnd(10)} scope=${binding.scope}${slotInfo}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. container.lookupBindings() — narrow to a specific token
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== lookupBindings for LoggerToken ===");
const loggerBindings = container.lookupBindings(LoggerToken);
for (const binding of loggerBindings) {
  console.log(`  kind=${binding.kind}, scope=${binding.scope}, id=${binding.id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. container.has() / hasOwn() — existence checks
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== has() / hasOwn() ===");

const UnboundToken = token<unknown>("Unbound");

console.log("has(LoggerToken):   ", container.has(LoggerToken)); // true
console.log("has(UnboundToken):  ", container.has(UnboundToken)); // false
console.log("hasOwn(LoggerToken):", container.hasOwn(LoggerToken)); // true

// Named / tagged existence checks
const PluginToken = token<{ name: string }>("Plugin");
container.bind(PluginToken).toConstantValue({ name: "alpha" }).whenNamed("alpha");
container.bind(PluginToken).toConstantValue({ name: "beta" }).whenNamed("beta");

console.log("has(PluginToken, {name:'alpha'}):", container.has(PluginToken, { name: "alpha" })); // true
console.log("has(PluginToken, {name:'gamma'}):", container.has(PluginToken, { name: "gamma" })); // false

// ─────────────────────────────────────────────────────────────────────────────
// 4. Inspecting a child container
//    - hasOwn() checks only the child; has() walks up to the parent.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Child container inspection ===");

const RequestScopedToken = token<{ requestId: string }>("RequestScoped");
const child = container.createChild();
child.bind(RequestScopedToken).toConstantValue({ requestId: "req-42" });

const childSnapshot = child.inspect();
console.log("child hasParent:         ", childSnapshot.hasParent);
console.log("child ownBindings count: ", childSnapshot.ownBindings.length);

// has() finds tokens in parent; hasOwn() does not.
console.log("child.has(LoggerToken):    ", child.has(LoggerToken)); // true (from parent)
console.log("child.hasOwn(LoggerToken): ", child.hasOwn(LoggerToken)); // false (not in child)
console.log("child.has(RequestScopedToken):    ", child.has(RequestScopedToken)); // true
console.log("child.hasOwn(RequestScopedToken): ", child.hasOwn(RequestScopedToken)); // true

// ─────────────────────────────────────────────────────────────────────────────
// 5. generateDependencyGraph() + toDotGraph()
//    Produces a Graphviz DOT string you can paste into https://graphviz.online
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Dependency graph (DOT) ===");
const graph = container.generateDependencyGraph();
console.log(`Graph nodes: ${graph.nodes.length}, edges: ${graph.edges.length}`);

const dot = toDotGraph(graph);
console.log("\n" + dot);

// ─────────────────────────────────────────────────────────────────────────────
// 6. toCytoscapeGraph() — for embedding in a React / browser UI
//    Drop the returned array into <CytoscapeComponent elements={elements} />
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Dependency graph (Cytoscape.js) ===");
const cytoscapeElements = toCytoscapeGraph(graph);
const nodeElements = cytoscapeElements.filter((element) => !("source" in element.data));
const edgeElements = cytoscapeElements.filter((element) => "source" in element.data);
console.log(`Cytoscape nodes: ${nodeElements.length}, edges: ${edgeElements.length}`);

// Print a few sample nodes so the output is readable.
console.log("\nSample nodes:");
for (const element of nodeElements.slice(0, 3)) {
  const nodeData = element.data as { id: string; label: string; kind: string; scope: string };
  console.log(
    `  id=${nodeData.id.slice(0, 8)}… label="${nodeData.label}" kind=${nodeData.kind} scope=${nodeData.scope}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Audit helper — detect unbound tokens referenced in snapshot
//    A real app could log this during startup to catch missing bindings early.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Startup audit ===");

function auditContainer(
  targetContainer: typeof container,
  requiredTokens: Array<ReturnType<typeof token>>,
): void {
  const missing = requiredTokens.filter((tok) => !targetContainer.has(tok));
  if (missing.length === 0) {
    console.log("All required tokens are bound ✓");
  } else {
    for (const tok of missing) {
      console.warn(`Missing binding for token: ${tokenName(tok)}`);
    }
  }
}

auditContainer(container, [LoggerToken, ConfigToken, DatabaseToken, UserServiceToken]);
auditContainer(container, [LoggerToken, UnboundToken]); // will warn
