/**
 * Example 09 — Error Handling
 *
 * Every error thrown by the container has a stable `.code` string and a
 * message with enough context to debug without looking at docs.
 *
 * Covered:
 * - TokenNotBoundError   — resolve() on unregistered token
 * - NoMatchingBindingError — name/tag hint matches nothing
 * - AsyncResolutionError — sync resolve() on async binding
 * - CircularDependencyError — A → B → A cycle
 * - MissingMetadataError — .to() / .toSelf() without @injectable
 * - ScopeViolationError  — container.validate() detects captive dependency
 * - AsyncModuleLoadError — load() called with AsyncModule
 */

import {
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  Container,
  MissingMetadataError,
  Module,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
  inject,
  injectable,
  scoped,
  singleton,
  token,
} from "@codefast/di";

// --- Helpers ----------------------------------------------------------------

function section(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

function caught(label: string, error: unknown): void {
  if (error instanceof Error) {
    const code = "code" in error ? ` [${String(error.code)}]` : "";
    console.log(`✓ ${label}${code}: ${error.message}`);
  }
}

// --- Tokens -----------------------------------------------------------------

const LoggerToken = token<Logger>("Logger");
const ServiceAToken = token<ServiceA>("ServiceA");
const ServiceBToken = token<ServiceB>("ServiceB");
const DbToken = token<Database>("Database");

interface Logger {
  log(msg: string): void;
}

// ============================================================================
// 1. TokenNotBoundError
// ============================================================================

section("1. TokenNotBoundError");

const emptyContainer = Container.create();

try {
  emptyContainer.resolve(LoggerToken);
} catch (e) {
  caught("resolve unbound token", e);
  console.log("  Is TokenNotBoundError:", e instanceof TokenNotBoundError);
}

// resolveOptional never throws — returns undefined instead
const optionalLogger = emptyContainer.resolveOptional(LoggerToken);
console.log("resolveOptional on unbound:", optionalLogger); // undefined

// ============================================================================
// 2. NoMatchingBindingError
// ============================================================================

section("2. NoMatchingBindingError");

const namedBindingContainer = Container.create();
namedBindingContainer
  .bind(LoggerToken)
  .toConstantValue({ log: (m: string) => console.log(m) })
  .whenNamed("console");

try {
  // Binding exists for name "console" but not "file"
  namedBindingContainer.resolve(LoggerToken, { name: "file" });
} catch (e) {
  caught("resolve with non-matching name hint", e);
  console.log("  Is NoMatchingBindingError:", e instanceof NoMatchingBindingError);
}

// ============================================================================
// 3. AsyncResolutionError
// ============================================================================

section("3. AsyncResolutionError");

class Database {
  async connect(): Promise<void> {}
}

const asyncBindingContainer = Container.create();
asyncBindingContainer
  .bind(DbToken)
  .toDynamicAsync(async () => {
    const database = new Database();
    await database.connect();
    return database;
  })
  .singleton();

try {
  // resolve() is sync — cannot await the async factory
  asyncBindingContainer.resolve(DbToken);
} catch (e) {
  caught("sync resolve on async binding", e);
  console.log("  Is AsyncResolutionError:", e instanceof AsyncResolutionError);
}

// Correct: use resolveAsync()
const asyncDatabase = await asyncBindingContainer.resolveAsync(DbToken);
console.log("resolveAsync succeeded:", asyncDatabase instanceof Database);

// ============================================================================
// 4. CircularDependencyError
// ============================================================================

section("4. CircularDependencyError");

// ServiceA → ServiceB → ServiceA (cycle)
class ServiceA {
  constructor(public b: ServiceB) {}
}
class ServiceB {
  constructor(public a: ServiceA) {}
}

const circularContainer = Container.create();
circularContainer.bind(ServiceAToken).toDynamic((ctx) => new ServiceA(ctx.resolve(ServiceBToken)));
circularContainer.bind(ServiceBToken).toDynamic((ctx) => new ServiceB(ctx.resolve(ServiceAToken)));

try {
  circularContainer.resolve(ServiceAToken);
} catch (e) {
  caught("circular dependency A → B → A", e);
  console.log("  Is CircularDependencyError:", e instanceof CircularDependencyError);

  if (e instanceof CircularDependencyError) {
    // .cycle shows the full dependency path
    console.log("  Cycle path:", e.cycle?.join(" → "));
  }
}

// ============================================================================
// 5. MissingMetadataError
// ============================================================================

section("5. MissingMetadataError");

// Class with constructor deps but no @injectable — container cannot auto-resolve
class UnmarkedService {
  constructor(private readonly logger: Logger) {}
}

const UnmarkedToken = token<UnmarkedService>("UnmarkedService");
const missingMetadataContainer = Container.create();
missingMetadataContainer.bind(LoggerToken).toConstantValue({ log: console.log });
missingMetadataContainer.bind(UnmarkedToken).to(UnmarkedService); // no @injectable on class

try {
  missingMetadataContainer.resolve(UnmarkedToken);
} catch (e) {
  caught("resolve class without @injectable", e);
  console.log("  Is MissingMetadataError:", e instanceof MissingMetadataError);
}

// Fix: add @injectable, or use toDynamic / toResolved instead
missingMetadataContainer
  .rebind(UnmarkedToken)
  .toDynamic((ctx) => new UnmarkedService(ctx.resolve(LoggerToken)));
const repairedService = missingMetadataContainer.resolve(UnmarkedToken);
console.log("  Fixed with toDynamic:", repairedService instanceof UnmarkedService);

// ============================================================================
// 6. ScopeViolationError
// ============================================================================

section("6. ScopeViolationError — captive dependency");

// Captive dependency: singleton depends on a scoped binding.
// The singleton is created once and captures the scoped instance forever,
// breaking the scoped isolation guarantee.

const ScopedServiceToken = token<ScopedService>("ScopedService");
const SingletonConsumerToken = token<SingletonConsumer>("SingletonConsumer");

@injectable([])
@scoped()
class ScopedService {
  readonly id = Math.random();
}

@injectable([inject(ScopedServiceToken)])
@singleton()
class SingletonConsumer {
  constructor(readonly scoped: ScopedService) {}
}

const scopeViolationContainer = Container.create();
scopeViolationContainer.bind(ScopedServiceToken).to(ScopedService);
scopeViolationContainer.bind(SingletonConsumerToken).to(SingletonConsumer);

try {
  // validate() checks the dependency graph for scope violations
  scopeViolationContainer.validate();
} catch (e) {
  caught("singleton depends on scoped (captive dependency)", e);
  console.log("  Is ScopeViolationError:", e instanceof ScopeViolationError);
}

// ============================================================================
// 7. AsyncModuleLoadError
// ============================================================================

section("7. AsyncModuleLoadError");

const AsyncDbModule = Module.createAsync("Database", async (api) => {
  const DbSetupToken = token<string>("DbSetup");
  api.bind(DbSetupToken).toConstantValue("connected");
});

const asyncModuleContainer = Container.create();

try {
  // load() only accepts sync modules — must use loadAsync() for AsyncModule
  asyncModuleContainer.load(AsyncDbModule as never);
} catch (e) {
  caught("load() called with AsyncModule", e);
  console.log("  Is AsyncModuleLoadError:", e instanceof AsyncModuleLoadError);
}

// Correct: use loadAsync()
await asyncModuleContainer.loadAsync(AsyncDbModule);
console.log("loadAsync succeeded");
