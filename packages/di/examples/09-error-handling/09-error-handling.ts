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
 * - MissingMetadataError — .to() / .toSelf() without `@injectable`
 * - ScopeViolationError  — container.validate() detects captive dependency
 * - AsyncModuleLoadError — load() called with AsyncModule
 */

import {
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  Container,
  inject,
  injectable,
  MissingMetadataError,
  Module,
  NoMatchingBindingError,
  ScopeViolationError,
  token,
  TokenNotBoundError,
} from "@codefast/di";

import { caughtError, item, ok, section } from "#/examples/support/log";

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const LoggerToken = token<Logger>("Logger");
const ServiceAToken = token<CircularServiceA>("ServiceA");
const ServiceBToken = token<CircularServiceB>("ServiceB");
const DatabaseToken = token<Database>("Database");

interface Logger {
  log(message: string): void;
}

// ── 1. TokenNotBoundError ────────────────────────────────────────────────────────────────────────────────────────────

section("1. TokenNotBoundError");

const emptyContainer = Container.create();

try {
  emptyContainer.resolve(LoggerToken);
} catch (error) {
  caughtError("resolve unbound token", error);
  item("Is TokenNotBoundError", error instanceof TokenNotBoundError);
}

// resolveOptional never throws — returns undefined instead
const optionalLogger = emptyContainer.resolveOptional(LoggerToken);
item("resolveOptional on unbound", optionalLogger); // undefined

// ── 2. NoMatchingBindingError ────────────────────────────────────────────────────────────────────────────────────────

section("2. NoMatchingBindingError");

const namedBindingContainer = Container.create();
namedBindingContainer
  .bind(LoggerToken)
  .toConstantValue({ log: (message: string) => console.log(message) })
  .whenNamed("console");

try {
  // Binding exists for name "console" but not "file"
  namedBindingContainer.resolve(LoggerToken, { name: "file" });
} catch (error) {
  caughtError("resolve with non-matching name hint", error);
  item("Is NoMatchingBindingError", error instanceof NoMatchingBindingError);
}

// ── 3. AsyncResolutionError ──────────────────────────────────────────────────────────────────────────────────────────

section("3. AsyncResolutionError");

class Database {
  async connect(): Promise<void> {}
}

const asyncBindingContainer = Container.create();
asyncBindingContainer
  .bind(DatabaseToken)
  .toDynamicAsync(async () => {
    const database = new Database();
    await database.connect();
    return database;
  })
  .singleton();

try {
  // resolve() is sync — cannot await the async factory
  asyncBindingContainer.resolve(DatabaseToken);
} catch (error) {
  caughtError("sync resolve on async binding", error);
  item("Is AsyncResolutionError", error instanceof AsyncResolutionError);
}

// Correct: use resolveAsync()
const asyncDatabase = await asyncBindingContainer.resolveAsync(DatabaseToken);
item("resolveAsync succeeded", asyncDatabase instanceof Database);

// ── 4. CircularDependencyError ───────────────────────────────────────────────────────────────────────────────────────

section("4. CircularDependencyError");

// ServiceA → ServiceB → ServiceA (cycle)
class CircularServiceA {
  constructor(public dependencyB: CircularServiceB) {}
}
class CircularServiceB {
  constructor(public dependencyA: CircularServiceA) {}
}

const circularContainer = Container.create();
circularContainer.bind(ServiceAToken).toDynamic((context) => new CircularServiceA(context.resolve(ServiceBToken)));
circularContainer.bind(ServiceBToken).toDynamic((context) => new CircularServiceB(context.resolve(ServiceAToken)));

try {
  circularContainer.resolve(ServiceAToken);
} catch (error) {
  caughtError("circular dependency A → B → A", error);
  item("Is CircularDependencyError", error instanceof CircularDependencyError);

  if (error instanceof CircularDependencyError) {
    // .cycle shows the full dependency path
    item("Cycle path", error.cycle?.join(" → "));
  }
}

// ── 5. MissingMetadataError ──────────────────────────────────────────────────────────────────────────────────────────

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
} catch (error) {
  caughtError("resolve class without @injectable", error);
  item("Is MissingMetadataError", error instanceof MissingMetadataError);
}

// Fix: add @injectable, or use toDynamic / toResolved instead
missingMetadataContainer
  .rebind(UnmarkedToken)
  .toDynamic((context) => new UnmarkedService(context.resolve(LoggerToken)));
const repairedService = missingMetadataContainer.resolve(UnmarkedToken);
item("Fixed with toDynamic", repairedService instanceof UnmarkedService);

// ── 6. ScopeViolationError ───────────────────────────────────────────────────────────────────────────────────────────

section("6. ScopeViolationError — captive dependency");

// Captive dependency: singleton depends on a scoped binding.
// The singleton is created once and captures the scoped instance forever,
// breaking the scoped isolation guarantee.

const ScopedServiceToken = token<ScopedService>("ScopedService");
const SingletonConsumerToken = token<SingletonConsumer>("SingletonConsumer");

@injectable()
class ScopedService {
  readonly id = Math.random();
}

@injectable([inject(ScopedServiceToken)])
class SingletonConsumer {
  constructor(private readonly scoped: ScopedService) {}
}

const scopeViolationContainer = Container.create();
scopeViolationContainer.bind(ScopedServiceToken).to(ScopedService).scoped();
scopeViolationContainer.bind(SingletonConsumerToken).to(SingletonConsumer).singleton();

try {
  // validate() checks the dependency graph for scope violations
  scopeViolationContainer.validate();
} catch (error) {
  caughtError("singleton depends on scoped (captive dependency)", error);
  item("Is ScopeViolationError", error instanceof ScopeViolationError);
}

// ── 7. AsyncModuleLoadError ──────────────────────────────────────────────────────────────────────────────────────────

section("7. AsyncModuleLoadError");

const AsyncDatabaseModule = Module.createAsync("Database", async (builder) => {
  const DatabaseSetupToken = token<string>("DbSetup");
  builder.bind(DatabaseSetupToken).toConstantValue("connected");
});

const asyncModuleContainer = Container.create();

try {
  // load() only accepts sync modules — must use loadAsync() for AsyncModule
  asyncModuleContainer.load(AsyncDatabaseModule as never);
} catch (error) {
  caughtError("load() called with AsyncModule", error);
  item("Is AsyncModuleLoadError", error instanceof AsyncModuleLoadError);
}

// Correct: use loadAsync()
await asyncModuleContainer.loadAsync(AsyncDatabaseModule);
ok("loadAsync succeeded");
