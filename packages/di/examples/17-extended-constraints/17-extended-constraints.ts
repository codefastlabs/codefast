/**
 * Example 17 — Extended Constraint Family
 *
 * Example 06 covered whenParentIs(). This example covers the full family and
 * shows when each predicate is the right choice.
 *
 * Constraint          | What it matches
 * ──────────────────────────────────────────────────────────────────────────
 * whenParentIs(T)         | direct parent token === T
 * whenNoParentIs(T)       | direct parent token !== T  (or no parent)
 * whenAnyAncestorIs(T)    | any token in the ancestor chain === T
 * whenNoAncestorIs(T)     | no token in the ancestor chain === T
 * whenParentNamed(n)      | direct parent was resolved with name n
 * whenAnyAncestorNamed(n) | any ancestor was resolved with name n
 * whenParentTagged(k,v)   | direct parent slot carries tag k=v
 * whenParentTaggedAll([]) | direct parent slot carries ALL given tags
 * whenAnyAncestorTagged(k,v)    | any ancestor slot carries tag k=v
 * whenAnyAncestorTaggedAll([])  | any ancestor slot carries ALL given tags
 *
 * Each section below builds a minimal scenario that isolates one predicate so
 * the contrast with its siblings is clear.
 */

import { Container, inject, injectable, token } from "@codefast/di";
import {
  whenAnyAncestorIs,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "@codefast/di/constraints";

// ── Shared logger interface ───────────────────────────────────────────────────

interface Logger {
  source: string;
  log(msg: string): void;
}

function makeLogger(source: string): Logger {
  return { source, log: (msg) => console.log(`[${source}] ${msg}`) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. whenParentIs vs whenNoParentIs
//
//    Scenario: two sibling services share a Logger token. OrderService should
//    get the "verbose" logger; everyone else gets the "silent" one.
// ─────────────────────────────────────────────────────────────────────────────

console.log("=== 1. whenParentIs / whenNoParentIs ===\n");

const LoggerToken = token<Logger>("Logger");
const OrderServiceToken = token<{ run(): void }>("OrderService");
const BillingServiceToken = token<{ run(): void }>("BillingService");

@injectable([inject(LoggerToken)])
class OrderService {
  constructor(private readonly logger: Logger) {}

  run(): void {
    this.logger.log("processing order");
  }
}

@injectable([inject(LoggerToken)])
class BillingService {
  constructor(private readonly logger: Logger) {}

  run(): void {
    this.logger.log("processing billing");
  }
}

const parentIsContainer = Container.create();

// Verbose logger only when the direct parent is OrderService.
parentIsContainer
  .bind(LoggerToken)
  .toConstantValue(makeLogger("verbose"))
  .when(whenParentIs(OrderServiceToken));

// Silent logger when the direct parent is NOT OrderService.
parentIsContainer
  .bind(LoggerToken)
  .toConstantValue(makeLogger("silent"))
  .when(whenNoParentIs(OrderServiceToken));

parentIsContainer.bind(OrderServiceToken).to(OrderService).singleton();
parentIsContainer.bind(BillingServiceToken).to(BillingService).singleton();

parentIsContainer.resolve(OrderServiceToken).run(); // [verbose] processing order
parentIsContainer.resolve(BillingServiceToken).run(); // [silent]  processing billing

// ─────────────────────────────────────────────────────────────────────────────
// 2. whenAnyAncestorIs vs whenNoAncestorIs
//
//    Scenario: a deeply nested graph. The Logger should switch to "audit" mode
//    whenever *any* node in the chain is a PaymentOrchestrator — regardless of
//    how many layers deep it sits.
//
//    Resolution path: PaymentOrchestrator → FraudChecker → RiskScorer → Logger
//    Logger receives "audit" because PaymentOrchestrator is an ancestor.
//
//    For BillingOrchestrator → InvoiceBuilder → Logger the ancestor chain never
//    contains PaymentOrchestrator, so Logger receives "standard".
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 2. whenAnyAncestorIs / whenNoAncestorIs ===\n");

const RiskScorerToken = token<{ score(): string }>("RiskScorer");
const FraudCheckerToken = token<{ check(): string }>("FraudChecker");
const PaymentOrchestratorToken = token<{ run(): void }>("PaymentOrchestrator");
const InvoiceBuilderToken = token<{ build(): string }>("InvoiceBuilder");
const BillingOrchestratorToken = token<{ run(): void }>("BillingOrchestrator");

@injectable([inject(LoggerToken)])
class RiskScorer {
  constructor(private readonly logger: Logger) {}

  score(): string {
    this.logger.log("scoring risk");
    return "low";
  }
}

@injectable([inject(RiskScorerToken)])
class FraudChecker {
  constructor(private readonly riskScorer: RiskScorer) {}

  check(): string {
    return this.riskScorer.score();
  }
}

@injectable([inject(FraudCheckerToken)])
class PaymentOrchestrator {
  constructor(private readonly fraudChecker: FraudChecker) {}

  run(): void {
    console.log("Fraud result:", this.fraudChecker.check());
  }
}

@injectable([inject(LoggerToken)])
class InvoiceBuilder {
  constructor(private readonly logger: Logger) {}

  build(): string {
    this.logger.log("building invoice");
    return "INV-001";
  }
}

@injectable([inject(InvoiceBuilderToken)])
class BillingOrchestrator {
  constructor(private readonly invoiceBuilder: InvoiceBuilder) {}

  run(): void {
    console.log("Invoice:", this.invoiceBuilder.build());
  }
}

const ancestorIsContainer = Container.create();

// "audit" logger when PaymentOrchestrator is anywhere in the ancestor chain.
ancestorIsContainer
  .bind(LoggerToken)
  .toConstantValue(makeLogger("audit"))
  .when(whenAnyAncestorIs(PaymentOrchestratorToken));

// "standard" logger when PaymentOrchestrator is NOT in the ancestor chain.
ancestorIsContainer
  .bind(LoggerToken)
  .toConstantValue(makeLogger("standard"))
  .when(whenNoAncestorIs(PaymentOrchestratorToken));

ancestorIsContainer.bind(RiskScorerToken).to(RiskScorer).singleton();
ancestorIsContainer.bind(FraudCheckerToken).to(FraudChecker).singleton();
ancestorIsContainer.bind(PaymentOrchestratorToken).to(PaymentOrchestrator).singleton();
ancestorIsContainer.bind(InvoiceBuilderToken).to(InvoiceBuilder).singleton();
ancestorIsContainer.bind(BillingOrchestratorToken).to(BillingOrchestrator).singleton();

ancestorIsContainer.resolve(PaymentOrchestratorToken).run(); // [audit]    scoring risk
ancestorIsContainer.resolve(BillingOrchestratorToken).run(); // [standard] building invoice

// ─────────────────────────────────────────────────────────────────────────────
// 3. whenParentNamed / whenAnyAncestorNamed
//
//    Scenario: a DataSource token has two named bindings ("primary", "replica").
//    A QueryRunner also uses DataSource — its binding is resolved with name
//    "replica". The Logger injected into DataSource uses whenParentNamed to
//    distinguish which DataSource instance is being constructed.
//
//    whenAnyAncestorNamed goes deeper: even when the named binding is not the
//    direct parent but further up the chain, the constraint still fires.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 3. whenParentNamed / whenAnyAncestorNamed ===\n");

const DataSourceToken = token<{ connect(): void }>("DataSource");
const QueryRunnerToken = token<{ execute(): void }>("QueryRunner");

@injectable([inject(LoggerToken)])
class DataSource {
  constructor(private readonly logger: Logger) {}

  connect(): void {
    this.logger.log("connected");
  }
}

@injectable([inject(DataSourceToken, { name: "replica" })])
class QueryRunner {
  constructor(private readonly dataSource: DataSource) {}

  execute(): void {
    this.dataSource.connect();
    console.log("query executed on replica");
  }
}

const namedContainer = Container.create();

// Logger adapts based on which named DataSource is being built.
namedContainer
  .bind(LoggerToken)
  .toConstantValue(makeLogger("primary-logger"))
  .when(whenParentNamed("primary"));

namedContainer
  .bind(LoggerToken)
  .toConstantValue(makeLogger("replica-logger"))
  .when(whenParentNamed("replica"));

// Fallback for contexts with no name (e.g. QueryRunner itself).
namedContainer
  .bind(LoggerToken)
  .toConstantValue(makeLogger("default-logger"))
  .when((ctx) => ctx.parent === undefined || ctx.parent.slot.name === undefined);

namedContainer.bind(DataSourceToken).to(DataSource).whenNamed("primary").singleton();
namedContainer.bind(DataSourceToken).to(DataSource).whenNamed("replica").singleton();
namedContainer.bind(QueryRunnerToken).to(QueryRunner).singleton();

namedContainer.resolve(DataSourceToken, { name: "primary" }).connect(); // [primary-logger]
namedContainer.resolve(DataSourceToken, { name: "replica" }).connect(); // [replica-logger]

// QueryRunner resolves the DataSource named "replica".
// The Logger inside that DataSource sees parent.slot.name === "replica".
namedContainer.resolve(QueryRunnerToken).execute(); // [replica-logger] connected

// ─────────────────────────────────────────────────────────────────────────────
// 4. whenParentTagged / whenParentTaggedAll
//
//    Scenario: a CacheAdapter token is bound multiple times — one per storage
//    backend. Services carry tags that describe which backend they need.
//    whenParentTagged matches a single tag; whenParentTaggedAll requires every
//    tag in the list to be present (AND semantics).
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 4. whenParentTagged / whenParentTaggedAll ===\n");

interface CacheAdapter {
  backend: string;
  read(key: string): string | undefined;
}

const CacheAdapterToken = token<CacheAdapter>("CacheAdapter");
const SessionStoreToken = token<{ getSession(id: string): string | undefined }>("SessionStore");
const ProductCacheToken = token<{ getProduct(id: string): string | undefined }>("ProductCache");

// SessionStore needs backend=redis AND region=eu.
@injectable([inject(CacheAdapterToken)])
class SessionStore {
  constructor(private readonly cache: CacheAdapter) {
    console.log(`SessionStore using ${cache.backend}`);
  }

  getSession(id: string): string | undefined {
    return this.cache.read(`session:${id}`);
  }
}

// ProductCache needs backend=memcached only.
@injectable([inject(CacheAdapterToken)])
class ProductCache {
  constructor(private readonly cache: CacheAdapter) {
    console.log(`ProductCache using ${cache.backend}`);
  }

  getProduct(id: string): string | undefined {
    return this.cache.read(`product:${id}`);
  }
}

const taggedContainer = Container.create();

// Redis-EU adapter: requires parent to have BOTH backend=redis AND region=eu.
taggedContainer
  .bind(CacheAdapterToken)
  .toConstantValue({ backend: "redis-eu", read: () => undefined })
  .when(
    whenParentTaggedAll([
      ["backend", "redis"],
      ["region", "eu"],
    ]),
  );

// Memcached adapter: requires parent to have backend=memcached (single tag).
taggedContainer
  .bind(CacheAdapterToken)
  .toConstantValue({ backend: "memcached", read: () => undefined })
  .when(whenParentTagged("backend", "memcached"));

// Tag SessionStore with both backend=redis and region=eu.
taggedContainer
  .bind(SessionStoreToken)
  .to(SessionStore)
  .whenTagged("backend", "redis")
  .whenTagged("region", "eu")
  .singleton();

// Tag ProductCache with backend=memcached only.
taggedContainer
  .bind(ProductCacheToken)
  .to(ProductCache)
  .whenTagged("backend", "memcached")
  .singleton();

taggedContainer.resolve(SessionStoreToken, {
  tags: [
    ["backend", "redis"],
    ["region", "eu"],
  ],
});
taggedContainer.resolve(ProductCacheToken, { tags: [["backend", "memcached"]] });

// ─────────────────────────────────────────────────────────────────────────────
// 5. whenAnyAncestorTagged / whenAnyAncestorTaggedAll
//
//    Scenario: a multi-tenant app where root service bindings are tagged by
//    tenant tier. A deep dependency (AuditLogger) automatically picks the
//    correct implementation based on which tagged ancestor is in the chain —
//    the intermediate layers (ReportGenerator) stay completely untagged.
//
//    Key rule: the tag sits on the ROOT binding slot. All intermediate nodes
//    are untagged (transient). The deep dependency uses whenAnyAncestorTagged
//    to inspect the chain and select the right implementation.
//
//    whenAnyAncestorTaggedAll requires ALL given tags to appear on the SAME
//    ancestor frame — not spread across different ancestor nodes.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 5. whenAnyAncestorTagged / whenAnyAncestorTaggedAll ===\n");

interface AuditLogger {
  tier: string;
  audit(event: string): void;
}

const AuditLoggerToken = token<AuditLogger>("AuditLogger");
const ReportGeneratorToken = token<{ generate(): void }>("ReportGenerator");
const AnalyticsDashboardToken = token<{ open(): void }>("AnalyticsDashboard");

@injectable([inject(AuditLoggerToken)])
class ReportGenerator {
  constructor(private readonly auditLogger: AuditLogger) {}

  generate(): void {
    this.auditLogger.audit("report.generated");
  }
}

@injectable([inject(ReportGeneratorToken)])
class AnalyticsDashboard {
  constructor(private readonly reportGenerator: ReportGenerator) {}

  open(): void {
    this.reportGenerator.generate();
  }
}

const tenantContainer = Container.create();

// AuditLogger: selected by scanning the ancestor chain for a tenant tag.
// whenAnyAncestorTaggedAll requires BOTH tags on the same ancestor frame.
tenantContainer
  .bind(AuditLoggerToken)
  .toConstantValue({
    tier: "enterprise",
    audit: (event) => console.log(`[ENTERPRISE AUDIT] ${event}`),
  })
  .when(
    whenAnyAncestorTaggedAll([
      ["tenant", "enterprise"],
      ["tier", "paid"],
    ]),
  );

// whenAnyAncestorTagged checks a single tag — simpler when only one tag identifies the tier.
tenantContainer
  .bind(AuditLoggerToken)
  .toConstantValue({
    tier: "starter",
    audit: (event) => console.log(`[starter audit] ${event}`),
  })
  .when(whenAnyAncestorTagged("tenant", "starter"));

// ReportGenerator: single untagged transient binding — no tenant knowledge needed.
// Transient so each AnalyticsDashboard singleton gets its own instance (and thus
// its own AuditLogger resolved in the correct ancestor context).
tenantContainer.bind(ReportGeneratorToken).to(ReportGenerator).transient();

// AnalyticsDashboard: two singleton bindings tagged by tenant.
// The tag on the binding slot is what the ancestor constraints check upstream.
tenantContainer
  .bind(AnalyticsDashboardToken)
  .to(AnalyticsDashboard)
  .whenTagged("tenant", "enterprise")
  .whenTagged("tier", "paid")
  .singleton();

tenantContainer
  .bind(AnalyticsDashboardToken)
  .to(AnalyticsDashboard)
  .whenTagged("tenant", "starter")
  .singleton();

console.log("Enterprise tenant:");
tenantContainer
  .resolve(AnalyticsDashboardToken, {
    tags: [
      ["tenant", "enterprise"],
      ["tier", "paid"],
    ],
  })
  .open(); // [ENTERPRISE AUDIT] report.generated

console.log("Starter tenant:");
tenantContainer.resolve(AnalyticsDashboardToken, { tags: [["tenant", "starter"]] }).open(); // [starter audit] report.generated

// ─────────────────────────────────────────────────────────────────────────────
// Quick reference — when to use each constraint
// ─────────────────────────────────────────────────────────────────────────────
//
//  whenParentIs(T)              — inject different impl per immediate consumer
//  whenNoParentIs(T)            — default impl for everyone except one consumer
//  whenAnyAncestorIs(T)         — propagate behaviour from a root service down
//  whenNoAncestorIs(T)          — opt out of behaviour when a root is absent
//  whenParentNamed(n)           — adapt to which named slot the parent was resolved in
//  whenAnyAncestorNamed(n)      — same but for any depth
//  whenParentTagged(k,v)        — adapt to a single tag on the immediate parent
//  whenParentTaggedAll([…])     — adapt to a combination of tags (AND) on parent
//  whenAnyAncestorTagged(k,v)   — propagate a single tag down the full chain
//  whenAnyAncestorTaggedAll([]) — propagate a tag combination down the full chain
