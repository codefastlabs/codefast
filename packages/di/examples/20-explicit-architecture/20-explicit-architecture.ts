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
 * The scenario is a private bank clearing a large transfer against a closing settlement window: one
 * `LargeTransferAttempted` event fans out to four subscribers (audit, metrics, fraud, compliance), the
 * domain refuses the overdraft that follows, and a frozen clock replays the exact instant. It exercises
 * `@injectable` constructor injection, `injectAll` fan-out, modules, singleton and scoped lifetimes,
 * `validate`, `rebind` for test doubles, and `generateDependencyGraph`.
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
  ComplianceToken,
  FraudEngineToken,
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

banner("Example 20 — Meridian Private Bank: the closing-window transfer");

section("Composition root — adapters wired to ports, validated at the edge");
const container = buildContainer();
ok("container.validate() passed — every port has a compatible adapter");

section("Open the client account and the settlement account");
const bank = container.resolve(BankingControllerToken);
const client = bank.open("Nadia Okonkwo", "USD");
const settlement = bank.open("Meridian Settlement", "USD");
bank.deposit(client, 50_000_000, "USD");
step("client funded with USD 50,000,000.00");

section("Request 1 — the USD 48,000,000 transfer clears before the window closes");
bank.transfer(client, settlement, 48_000_000, "USD");
const accounts = container.resolve(AccountRepositoryToken);
item("client balance", accounts.findById(toAccountId(client))?.balance.toString());
item("settlement balance", accounts.findById(toAccountId(settlement))?.balance.toString());

section("Request 2 — a second large transfer overdraws; the DOMAIN refuses it, not the database");
try {
  bank.transfer(client, settlement, 5_000_000, "USD");
} catch (error) {
  caughtError("second transfer refused", error);
}

section("Outbound fan-out — one attempt, four adapters (injectAll)");
item("audit trail", container.resolve(AuditLogToken).entries);
item("events counted by metrics", container.resolve(MetricsToken).total);
item("large transfers flagged by fraud", container.resolve(FraudEngineToken).flagged);
item("compliance ledger", container.resolve(ComplianceToken).movements);

section("Per-request scope — one correlation id per request, for later investigation");
const request1 = container.createChild();
const request2 = container.createChild();
item("request 1, resolved twice (scoped → identical)", [
  request1.resolve(RequestContextToken).requestId,
  request1.resolve(RequestContextToken).requestId,
]);
item("request 2 (a separate child → its own value)", request2.resolve(RequestContextToken).requestId);

section("Replay the incident — freeze the clock and stub the ids, swapping only the adapters");
const replay = buildContainer();
replay.rebind(ClockToken).toConstantValue(new FixedClock(new Date("2029-08-14T01:59:47.000Z")));
replay.rebind(IdGeneratorToken).toConstantValue({ next: () => toAccountId("acc-replay-1") });
item("id minted by the stubbed generator", replay.resolve(BankingControllerToken).open("Replay", "USD"));
ok("the same use cases ran against a frozen clock — zero domain changes");

section("The dependency rule, made visible");
step("The domain ring never imports @codefast/di, even though the outer rings are decorated. Prove it:");
step('grep -rl "@codefast/di" domain   # → no matches');
step("Dependency graph as Graphviz DOT (paste into an online viewer):");
console.log(toDotGraph(container.generateDependencyGraph()));
