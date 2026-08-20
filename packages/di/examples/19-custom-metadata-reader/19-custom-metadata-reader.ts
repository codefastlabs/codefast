/**
 * Example 19 — Custom Metadata Reader
 *
 * Shows how to teach the container about classes that cannot carry decorators — third-party
 * classes, generated code, plain JavaScript — by supplying their metadata from a table.
 *
 * Covers:
 * - MetadataReader                        → the interface the resolver reads class wiring through
 * - `Container.create({ metadataReader })`  → install your own reader
 * - defaultMetadataReader                 → delegate to it so decorated classes keep working
 * - getConstructorMetadata                → constructor parameters without `@injectable`
 * - getLifecycleMetadata                  → postConstruct / preDestroy without decorators
 * - MetadataReaderToken                   → the binding path, and the one shape of it that works
 */

import {
  Container,
  defaultMetadataReader,
  inject,
  injectable,
  MetadataReaderToken,
  MissingMetadataError,
  token,
} from "@codefast/di";
import type { ConstructorMetadata, Constructor, LifecycleMetadata, MetadataReader } from "@codefast/di";

import { item, section } from "../support/log";

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const ConfigToken = token<Config>("Config");
const LoggerToken = token<Logger>("Logger");
const PoolToken = token<LegacyPool>("Pool");
const ReportServiceToken = token<ReportService>("ReportService");

// ── Interfaces ───────────────────────────────────────────────────────────────────────────────────────────────────────

interface Config {
  dsn: string;
}

interface Logger {
  log(message: string): void;
}

// ── Classes the container must wire ──────────────────────────────────────────────────────────────────────────────────

/**
 * Stands in for a class from a dependency: no decorators, and you cannot add any.
 *
 * @remarks `open`/`close` are ordinary methods — the reader is what turns them into lifecycle
 * hooks, so this file stays importable by code that has no DI at all.
 */
class LegacyPool {
  opened = false;
  closed = false;

  constructor(
    readonly config: Config,
    readonly logger: Logger,
  ) {}

  open(): void {
    this.opened = true;
    this.logger.log(`pool open → ${this.config.dsn}`);
  }

  close(): void {
    this.closed = true;
    this.logger.log("pool closed");
  }

  query(sql: string): string {
    return `${sql} @ ${this.config.dsn}`;
  }
}

/** Decorated the normal way, to prove the delegating reader does not break the common path. */
@injectable([inject(PoolToken), inject(LoggerToken)])
class ReportService {
  constructor(
    private readonly pool: LegacyPool,
    private readonly logger: Logger,
  ) {}

  run(): string {
    this.logger.log("report requested");

    return this.pool.query("SELECT count(*) FROM orders");
  }
}

// ── The metadata tables ──────────────────────────────────────────────────────────────────────────────────────────────

const constructorMetadata = new Map<Constructor, ConstructorMetadata>([
  [
    LegacyPool,
    {
      params: [
        { index: 0, token: ConfigToken, optional: false, multi: false },
        { index: 1, token: LoggerToken, optional: false, multi: false },
      ],
    },
  ],
]);

const lifecycleMetadata = new Map<Constructor, LifecycleMetadata>([
  [LegacyPool, { postConstruct: ["open"], preDestroy: ["close"] }],
]);

/**
 * Answers from the tables first, then falls back to the decorator reader.
 *
 * @remarks Falling back is not optional — the resolver has one reader for every class it builds,
 * so a table-only reader would make every decorated class throw MissingMetadataError.
 */
class TableFirstMetadataReader implements MetadataReader {
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    return constructorMetadata.get(target) ?? defaultMetadataReader.getConstructorMetadata(target);
  }

  getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
    return lifecycleMetadata.get(target) ?? defaultMetadataReader.getLifecycleMetadata(target);
  }

  getAccessorMetadata(target: Constructor): ReturnType<typeof defaultMetadataReader.getAccessorMetadata> {
    return defaultMetadataReader.getAccessorMetadata(target);
  }
}

// ── 1. Without a reader, an undecorated class is unresolvable ────────────────────────────────────────────────────────

section("1. The default reader only knows decorators");

const plainContainer = Container.create();

plainContainer.bind(ConfigToken).toConstantValue({ dsn: "postgres://localhost/app" });
plainContainer.bind(LoggerToken).toConstantValue({ log: (message) => console.log(`  [log] ${message}`) });
plainContainer.bind(PoolToken).to(LegacyPool).singleton();

try {
  plainContainer.resolve(PoolToken);
} catch (error) {
  if (error instanceof MissingMetadataError) {
    item("code", error.code);
    item("message", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Install the reader at construction time
//    A container hands its reader to the resolver it builds in its constructor,
//    so an option is the one source that is already in place by then.
// ─────────────────────────────────────────────────────────────────────────────

section("2. Container.create({ metadataReader })");

const app = Container.create({ metadataReader: new TableFirstMetadataReader() });

app.bind(ConfigToken).toConstantValue({ dsn: "postgres://localhost/app" });
app.bind(LoggerToken).toConstantValue({ log: (message) => console.log(`  [log] ${message}`) });
app.bind(PoolToken).to(LegacyPool).singleton();
app.bind(ReportServiceToken).to(ReportService).singleton();

const pool = app.resolve(PoolToken);

item("constructor params came from the table", pool.config.dsn);
item("postConstruct ran open()", pool.opened);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Decorated classes still resolve — that is what the fallback buys
// ─────────────────────────────────────────────────────────────────────────────

section("3. Decorated classes are unaffected");

console.log(app.resolve(ReportServiceToken).run());

// ─────────────────────────────────────────────────────────────────────────────
// 4. validate() and the dependency graph read the same reader
//    One container has one reader, so tooling cannot disagree with resolution.
// ─────────────────────────────────────────────────────────────────────────────

section("4. Static checks see the table too");

app.validate();
console.log("validate(): no missing or scope-violating bindings");

const graph = app.generateDependencyGraph();

console.log("nodes:", graph.nodes.map((node) => node.tokenName).join(", "));
for (const edge of graph.edges) {
  const from = graph.nodes.find((node) => node.id === edge.from)?.tokenName ?? "?";
  const to = graph.nodes.find((node) => node.id === edge.to)?.tokenName ?? "?";

  console.log(`  ${from} → ${to} ${edge.label ?? ""}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Children inherit the reader; the token binding only reaches a child
//    A container resolves MetadataReaderToken while constructing, so the binding
//    has to predate the container that uses it.
// ─────────────────────────────────────────────────────────────────────────────

section("5. Inheritance, and the token path");

const request = app.createChild();

request.bind(ConfigToken).toConstantValue({ dsn: "postgres://localhost/replica" });
request.bind(PoolToken).to(LegacyPool).singleton();

item("child inherited the reader", request.resolve(PoolToken).config.dsn);

const readerRoot = Container.create();

readerRoot.bind(MetadataReaderToken).toConstantValue(new TableFirstMetadataReader());

const boundChild = readerRoot.createChild();

boundChild.bind(ConfigToken).toConstantValue({ dsn: "postgres://localhost/bound" });
boundChild.bind(LoggerToken).toConstantValue({ log: (message) => console.log(`  [log] ${message}`) });
boundChild.bind(PoolToken).to(LegacyPool).singleton();

item("bound in the parent", boundChild.resolve(PoolToken).config.dsn);

// The same binding on the container that needs it is too late — prefer the option.
const tooLate = Container.create();

tooLate.bind(MetadataReaderToken).toConstantValue(new TableFirstMetadataReader());
tooLate.bind(ConfigToken).toConstantValue({ dsn: "postgres://localhost/late" });
tooLate.bind(LoggerToken).toConstantValue({ log: () => undefined });
tooLate.bind(PoolToken).to(LegacyPool).singleton();

try {
  tooLate.resolve(PoolToken);
} catch (error) {
  if (error instanceof MissingMetadataError) {
    console.log("bound on itself:            throws", error.code);
  }
}

// ── 6. preDestroy from the table runs on dispose ─────────────────────────────────────────────────────────────────────

section("6. Teardown");

await app.dispose();
item("preDestroy ran close()", pool.closed);
