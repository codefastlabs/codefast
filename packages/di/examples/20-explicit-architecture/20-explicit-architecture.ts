/**
 * Example 20 — Explicit Architecture (Ports & Adapters).
 *
 * @remarks
 * Unlike the other examples, this one is spread across a directory of small files to make the
 * architecture physical. Dependencies point inward — `domain` knows nothing, `application` knows only
 * `domain`, and `infrastructure` and `primary` implement the ports. The classes are wired with
 * `@injectable` / `inject`, so `@codefast/di` reaches every ring except the innermost: the `domain`
 * stays framework-free. The container is the composition root and lives at the edge.
 *
 * The scenario is a tiny banking service: open accounts, deposit, transfer, and watch the domain
 * refuse an overdraft. It exercises `@injectable` constructor injection, `injectAll` fan-out, modules,
 * singleton and scoped lifetimes, `validate`, `rebind` for test doubles, and `generateDependencyGraph`.
 */

import { toDotGraph } from "@codefast/di";

import { AccountRepositoryToken } from "#/examples/20-explicit-architecture/application/ports/account-repository.port";
import { ClockToken } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import type { Clock } from "#/examples/20-explicit-architecture/application/ports/clock.port";
import { IdGeneratorToken } from "#/examples/20-explicit-architecture/application/ports/id-generator.port";
import { RequestContextToken } from "#/examples/20-explicit-architecture/application/ports/request-context.port";
import { buildContainer } from "#/examples/20-explicit-architecture/composition/build-container";
import {
  AuditLogToken,
  BankingControllerToken,
  MetricsToken,
} from "#/examples/20-explicit-architecture/composition/tokens";
import { toAccountId } from "#/examples/20-explicit-architecture/domain/account-id";
import { banner, caughtError, item, ok, section, step } from "#/examples/support/log";

// ── Test doubles ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** A `Clock` frozen at a fixed instant, swapped in through the same port the domain already depends on. */
class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}

  now(): Date {
    return this.fixed;
  }
}

// ── Scenario ─────────────────────────────────────────────────────────────────────────────────────────────────────────

banner("Example 20 — Explicit Architecture (Ports & Adapters)");

section("Composition root — adapters wired to ports, validated at the edge");
const container = buildContainer();
ok("container.validate() passed — every port has a compatible adapter");

section("Driving the app through a primary adapter");
const bank = container.resolve(BankingControllerToken);
const alice = bank.open("Alice", "USD");
const bob = bank.open("Bob", "USD");
item("opened account for Alice", alice);
item("opened account for Bob", bob);

bank.deposit(alice, 100, "USD");
step("Alice deposited USD 100.00");
bank.transfer(alice, bob, 30, "USD");
step("transferred USD 30.00 from Alice to Bob");

const accounts = container.resolve(AccountRepositoryToken);
item("Alice balance", accounts.findById(toAccountId(alice))?.balance.toString());
item("Bob balance", accounts.findById(toAccountId(bob))?.balance.toString());

section("Domain invariant — the aggregate refuses an overdraft, not the database");
try {
  bank.transfer(bob, alice, 999, "USD");
} catch (error) {
  caughtError("overdraft refused", error);
}

section("Outbound fan-out — one event, many adapters (injectAll)");
const audit = container.resolve(AuditLogToken);
const metrics = container.resolve(MetricsToken);
item("audit trail", audit.entries);
item("events counted by the metrics adapter", metrics.total);

section("Per-request scope — one unit of work per child container");
const request1 = container.createChild();
const request2 = container.createChild();
item("request 1, resolved twice (scoped → identical)", [
  request1.resolve(RequestContextToken).requestId,
  request1.resolve(RequestContextToken).requestId,
]);
item("request 2 (a separate child → its own value)", request2.resolve(RequestContextToken).requestId);

section("Testability — swap infrastructure without touching domain or use cases");
const underTest = buildContainer();
underTest.rebind(ClockToken).toConstantValue(new FixedClock(new Date("2020-01-01T00:00:00.000Z")));
underTest.rebind(IdGeneratorToken).toConstantValue({ next: () => toAccountId("test-0001") });
const testBank = underTest.resolve(BankingControllerToken);
item("id minted by the stubbed generator", testBank.open("Test", "USD"));
ok("the same OpenAccount use case ran against stub adapters — zero domain changes");

section("The dependency rule, made visible");
step("The domain ring never imports @codefast/di, even though the outer rings are decorated. Prove it:");
step('grep -rl "@codefast/di" domain   # → no matches');
step("Dependency graph as Graphviz DOT (paste into an online viewer):");
console.log(toDotGraph(container.generateDependencyGraph()));
