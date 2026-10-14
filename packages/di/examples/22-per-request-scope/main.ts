/**
 * Example 22 — Per-Request Scope
 *
 * Shows:
 * - One child container per request, opened with `await using` and torn down at scope exit
 * - The request itself bound into the child with `toConstantValue`
 * - `scoped` bindings declared once on the root, one instance per request, deactivated with it
 * - Teardown on the failure path, and why nothing may outlive the scope
 * - `validate()` refusing a singleton that would capture a request-scoped service
 */

import {
  Container,
  DisposedContainerError,
  inject,
  injectable,
  preDestroy,
  ScopeViolationError,
  token,
  validate,
} from "@codefast/di";

import { banner, caughtError, item, ok, section, step } from "#examples/support/log";

// ── Domain ───────────────────────────────────────────────────────────────────────────────────────────────────────────

/** What one request carries into the container: bound per child, never on the root. */
interface RequestContext {
  readonly requestId: string;
  readonly userId: string;
}

/** Process-wide connection pool — a root singleton every request shares. */
class Database {
  readonly #log: Array<string> = [];

  record(statement: string): void {
    this.#log.push(statement);
  }

  statements(): ReadonlyArray<string> {
    return this.#log;
  }
}

const RequestContextToken = token<RequestContext>("per-request-scope:RequestContext");
const DatabaseToken = token<Database>("per-request-scope:Database");

/** A transaction that commits only when the request says so, and rolls back otherwise at teardown. */
@injectable([inject(DatabaseToken), inject(RequestContextToken)])
class UnitOfWork {
  #committed = false;

  constructor(
    private readonly database: Database,
    private readonly request: RequestContext,
  ) {
    database.record(`BEGIN ${request.requestId}`);
  }

  commit(): void {
    this.#committed = true;
  }

  @preDestroy()
  close(): void {
    this.database.record(`${this.#committed ? "COMMIT" : "ROLLBACK"} ${this.request.requestId}`);
  }
}

const UnitOfWorkToken = token<UnitOfWork>("per-request-scope:UnitOfWork");

/** Request-level service — scoped, so every collaborator in one request shares its `UnitOfWork`. */
@injectable([inject(UnitOfWorkToken), inject(RequestContextToken)])
class OrderService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly request: RequestContext,
  ) {}

  place(sku: string): string {
    if (sku === "") {
      throw new Error("sku is required");
    }
    this.unitOfWork.commit();
    return `order for ${sku} by ${this.request.userId}`;
  }

  sameUnitOfWork(other: UnitOfWork): boolean {
    return this.unitOfWork === other;
  }
}

const OrderServiceToken = token<OrderService>("per-request-scope:OrderService");
const ReportToken = token<OrderService>("per-request-scope:Report");

// ── Composition root ─────────────────────────────────────────────────────────────────────────────────────────────────

function createRoot(): Container {
  const root = Container.create();

  root.bind(DatabaseToken).toConstantValue(new Database());
  // Declared once on the root; the instance belongs to whichever child resolves it first.
  root.bind(UnitOfWorkToken).to(UnitOfWork).scoped();
  root.bind(OrderServiceToken).to(OrderService).scoped();
  validate(root);

  return root;
}

// ── Request handler ──────────────────────────────────────────────────────────────────────────────────────────────────

let sequence = 0;

/** The whole pattern: open a child, bind the request, resolve, and let `await using` dispose it. */
async function handle(root: Container, userId: string, sku: string): Promise<{ status: number; body: string }> {
  sequence += 1;

  await using scope = root.createChild();
  scope.bind(RequestContextToken).toConstantValue({ requestId: `req-${String(sequence)}`, userId });

  try {
    return { status: 200, body: scope.resolve(OrderServiceToken).place(sku) };
  } catch (error) {
    return { status: 400, body: error instanceof Error ? error.message : String(error) };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  banner("Example 22 — Per-Request Scope");

  await using root = createRoot();
  const database = root.resolve(DatabaseToken);

  section("Concurrent requests stay isolated");
  const responses = await Promise.all([handle(root, "ada", "book"), handle(root, "linus", "lamp")]);
  for (const response of responses) {
    item(String(response.status), response.body);
  }
  ok("each request committed its own unit of work");

  section("The failure path still tears the scope down");
  const failed = await handle(root, "grace", "");
  item(String(failed.status), failed.body);
  ok("the scope was disposed, so its unit of work rolled back");

  section("One request, one instance");
  {
    await using scope = root.createChild();
    scope.bind(RequestContextToken).toConstantValue({ requestId: "req-probe", userId: "probe" });
    const service = scope.resolve(OrderServiceToken);
    item("same UnitOfWork inside the request", service.sameUnitOfWork(scope.resolve(UnitOfWorkToken)));
  }

  section("Database log, in order");
  for (const statement of database.statements()) {
    step(statement);
  }

  section("Nothing may outlive the scope");
  let escaped: (() => string) | undefined;
  {
    await using scope = root.createChild();
    scope.bind(RequestContextToken).toConstantValue({ requestId: "req-late", userId: "late" });
    // A lazy callback (a stream's pull, a deferred promise) that resolves after the block exits.
    escaped = () => scope.resolve(OrderServiceToken).place("late");
  }
  try {
    escaped();
  } catch (error) {
    if (!(error instanceof DisposedContainerError)) {
      throw error;
    }
    caughtError("resolved after the scope closed", error);
  }

  section("validate() refuses a singleton capturing request state");
  {
    await using captive = root.createChild();
    captive
      .bind(ReportToken)
      .toResolved((orders) => orders, [OrderServiceToken])
      .singleton();
    try {
      validate(captive);
    } catch (error) {
      if (!(error instanceof ScopeViolationError)) {
        throw error;
      }
      caughtError("validate()", error);
    }
  }
}

await main();
