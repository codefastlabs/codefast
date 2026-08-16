import { Container, injectAll, injectable, Module, optional, postConstruct, preDestroy, token } from "@codefast/di";
import type { ContainerGraphJson } from "@codefast/di";
import { toCytoscapeGraph } from "@codefast/di/graph-adapters/cytoscape";
import { toDotGraph } from "@codefast/di/graph-adapters/dot";
import { toMermaidGraph } from "@codefast/di/graph-adapters/mermaid";
import { toReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { createServerFn } from "@tanstack/react-start";

import { ensureMapPolyfill } from "#/features/di/server/ensure-map-polyfill";

// ── Domain model ─────────────────────────────────────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

/** One row of the container-inspector table shown in the UI. */
export interface BindingInfo {
  token: string;
  scope: string;
  kind: string;
}

/** One entry per graph adapter; the key is what the export panel labels the tab. */
export interface GraphExports {
  dot: string;
  mermaid: string;
  cytoscape: string;
  json: string;
}

/** Evidence that a transient binding hands back a fresh instance on every resolve. */
export interface TransientProof {
  first: string;
  second: string;
  distinct: boolean;
}

export interface BoardSnapshot {
  /** Id of the per-request scoped instance — changes on every server round-trip. */
  requestId: string;
  receivedAt: string;
  tasks: Array<Task>;
  /** Append-only log from the singleton ActivityLog — survives across requests. */
  activity: Array<string>;
  /** React Flow nodes/edges from `toReactFlowGraph(generateDependencyGraph())` — the canvas input. */
  graph: ReactFlowGraph;
  /** The same graph as portable sources, one per adapter, for the export panel. */
  graphExports: GraphExports;
  /** Result of `container.validate()` for this snapshot — runtime rebinding can change it. */
  validated: boolean;
  /** Validation errors from the last add attempt — empty when nothing was rejected. */
  validationErrors: Array<string>;
  /** Whether the optional MetricsExporter dependency is bound. */
  metricsEnabled: boolean;
  /** Serialized `container.inspect()` output for the inspector panel. */
  bindings: Array<BindingInfo>;
  /** Two resolves of the transient IdGenerator, proving they differ. */
  transientProof: TransientProof;
}

interface Clock {
  now: () => string;
}

interface ActivityLog {
  record: (message: string) => void;
  entries: () => Array<string>;
}

/** Mints ids; `instanceId` is unique per instance so a transient scope is observable. */
interface IdGenerator {
  readonly instanceId: string;
  next: () => string;
}

/** A single add-task guard; returns an error message or `undefined` when the title passes. */
interface TaskValidator {
  readonly name: string;
  validate: (title: string, existingTitles: ReadonlyArray<string>) => string | undefined;
}

/** Runs every registered TaskValidator and aggregates their messages. */
interface TaskValidation {
  collect: (title: string, existingTitles: ReadonlyArray<string>) => Array<string>;
}

/** Optional telemetry sink — bound/unbound at runtime by the metrics toggle. */
interface MetricsExporter {
  record: (event: string) => void;
}

interface TaskRepository {
  list: () => Array<Task>;
  add: (title: string, id: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
}

interface RequestContext {
  requestId: string;
  receivedAt: string;
  /** When true, `@preDestroy` records teardown into the singleton activity log. */
  recordTeardown: boolean;
}

/* ---------------------------------------------------------------------------
 * Tokens — typed keys; constructor dependencies are declared via `@injectable([...])`
 * (TC39 decorators have no parameter decorators, so the order here maps to the params).
 * ------------------------------------------------------------------------ */

const ClockToken = token<Clock>("Clock");
const ActivityLogToken = token<ActivityLog>("ActivityLog");
const IdGeneratorToken = token<IdGenerator>("IdGenerator");
const TaskValidatorToken = token<TaskValidator>("TaskValidator");
const TaskValidationToken = token<TaskValidation>("TaskValidation");
const MetricsExporterToken = token<MetricsExporter>("MetricsExporter");
const TaskRepositoryToken = token<TaskRepository>("TaskRepository");
const RequestContextToken = token<RequestContext>("RequestContext");

// ── Infrastructure (singletons + a transient id generator) ───────────────────────────────────────────────────────────

@injectable()
class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

@injectable()
class InMemoryActivityLog implements ActivityLog {
  readonly #entries: Array<string> = [];

  // Lifecycle hook: runs once, right after the container constructs this singleton.
  @postConstruct()
  boot(): void {
    this.#entries.push("container booted · activity log ready");
  }

  record(message: string): void {
    this.#entries.push(message);
  }

  entries(): Array<string> {
    return [...this.#entries];
  }
}

@injectable()
class UuidGenerator implements IdGenerator {
  // Unique per constructed instance — a transient binding produces a new one each resolve.
  readonly instanceId = globalThis.crypto.randomUUID().slice(0, 8);

  next(): string {
    return globalThis.crypto.randomUUID();
  }
}

// Records into the singleton ActivityLog so toggled-on metrics show up in the log panel.
@injectable([ActivityLogToken])
class ActivityLogMetricsExporter implements MetricsExporter {
  readonly #log: ActivityLog;

  constructor(log: ActivityLog) {
    this.#log = log;
  }

  record(event: string): void {
    this.#log.record(`metric · ${event}`);
  }
}

/* ---------------------------------------------------------------------------
 * Validators — multiple implementations bound to one token, collected via injectAll
 * ------------------------------------------------------------------------ */

const MAX_TITLE_LENGTH = 80;

@injectable()
class NonEmptyTitleValidator implements TaskValidator {
  readonly name = "non-empty";

  validate(title: string): string | undefined {
    return title.trim().length === 0 ? "Title cannot be empty." : undefined;
  }
}

@injectable()
class MaxTitleLengthValidator implements TaskValidator {
  readonly name = "max-length";

  validate(title: string): string | undefined {
    return title.length > MAX_TITLE_LENGTH ? `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` : undefined;
  }
}

@injectable()
class UniqueTitleValidator implements TaskValidator {
  readonly name = "no-duplicate";

  validate(title: string, existingTitles: ReadonlyArray<string>): string | undefined {
    const normalized = title.trim().toLowerCase();

    return existingTitles.some((existing) => existing.trim().toLowerCase() === normalized)
      ? "A task with this title already exists."
      : undefined;
  }
}

// injectAll(...) collects every binding on TaskValidatorToken into an Array<TaskValidator>.
@injectable([injectAll(TaskValidatorToken)])
class CompositeTaskValidator implements TaskValidation {
  readonly #validators: ReadonlyArray<TaskValidator>;

  constructor(validators: Array<TaskValidator>) {
    this.#validators = validators;
  }

  collect(title: string, existingTitles: ReadonlyArray<string>): Array<string> {
    return this.#validators
      .map((validator) => validator.validate(title, existingTitles))
      .filter((message): message is string => message !== undefined);
  }
}

// ── Repository (singleton — task state persists across requests) ─────────────────────────────────────────────────────

@injectable([ClockToken, ActivityLogToken])
class InMemoryTaskRepository implements TaskRepository {
  readonly #clock: Clock;
  readonly #log: ActivityLog;
  readonly #tasks = new Map<string, Task>();

  constructor(clock: Clock, log: ActivityLog) {
    this.#clock = clock;
    this.#log = log;
  }

  list(): Array<Task> {
    return [...this.#tasks.values()];
  }

  add(title: string, id: string): void {
    const task: Task = { id, title, done: false, createdAt: this.#clock.now() };

    this.#tasks.set(task.id, task);
    this.#log.record(`added "${title}"`);
  }

  toggle(id: string): void {
    const task = this.#tasks.get(id);

    if (task) {
      task.done = !task.done;
      this.#log.record(`${task.done ? "completed" : "reopened"} "${task.title}"`);
    }
  }

  remove(id: string): void {
    const task = this.#tasks.get(id);

    if (task) {
      this.#tasks.delete(id);
      this.#log.record(`removed "${task.title}"`);
    }
  }
}

/* ---------------------------------------------------------------------------
 * Service (scoped — one instance per request via a child container)
 * ------------------------------------------------------------------------ */

// Deps map positionally: repository, log, context, id generator, composite validator, optional metrics.
@injectable([
  TaskRepositoryToken,
  ActivityLogToken,
  RequestContextToken,
  IdGeneratorToken,
  TaskValidationToken,
  optional(MetricsExporterToken),
])
class TaskService {
  readonly #repository: TaskRepository;
  readonly #log: ActivityLog;
  readonly #context: RequestContext;
  readonly #idGenerator: IdGenerator;
  readonly #validation: TaskValidation;
  readonly #metrics: MetricsExporter | undefined;

  constructor(
    repository: TaskRepository,
    log: ActivityLog,
    context: RequestContext,
    idGenerator: IdGenerator,
    validation: TaskValidation,
    metrics: MetricsExporter | undefined,
  ) {
    this.#repository = repository;
    this.#log = log;
    this.#context = context;
    this.#idGenerator = idGenerator;
    this.#validation = validation;
    this.#metrics = metrics;
  }

  /** Validates then adds a task; returns any validation errors instead of throwing. */
  add(title: string): Array<string> {
    const errors = this.#validation.collect(
      title,
      this.#repository.list().map((task) => task.title),
    );

    if (errors.length > 0) {
      this.#log.record(`rejected "${title}" · ${errors.length} validation error(s)`);

      return errors;
    }

    this.#repository.add(title, this.#idGenerator.next());
    // Optional dependency — only fires when a MetricsExporter is bound.
    this.#metrics?.record("task.added");

    return [];
  }

  toggle(id: string): void {
    this.#repository.toggle(id);
  }

  remove(id: string): void {
    this.#repository.remove(id);
  }

  // preDestroy always runs on child dispose; only mutation requests record it so the loader's
  // read-only getBoard (and router.invalidate) don't spam a second "torn down" line.
  @preDestroy()
  teardown(): void {
    if (!this.#context.recordTeardown) {
      return;
    }

    this.#log.record(`request ${this.#context.requestId} torn down · per-request service disposed`);
  }
}

const TaskServiceToken = token<TaskService>("TaskService");

// ── Modules — reusable bundles of bindings ───────────────────────────────────────────────────────────────────────────

const infrastructureModule = Module.create("infrastructure", (builder) => {
  builder.bind(ClockToken).to(SystemClock).singleton();
  builder.bind(ActivityLogToken).to(InMemoryActivityLog).singleton();
  // Transient: every resolve returns a brand-new generator instance.
  builder.bind(IdGeneratorToken).to(UuidGenerator).transient();
});

const validationModule = Module.create("validation", (builder) => {
  // Multi-binding: same token, distinct named slots — without whenNamed, last-wins keeps only one.
  builder.bind(TaskValidatorToken).to(NonEmptyTitleValidator).whenNamed("non-empty").singleton();
  builder.bind(TaskValidatorToken).to(MaxTitleLengthValidator).whenNamed("max-length").singleton();
  builder.bind(TaskValidatorToken).to(UniqueTitleValidator).whenNamed("no-duplicate").singleton();
  builder.bind(TaskValidationToken).to(CompositeTaskValidator).singleton();
});

const domainModule = Module.create("domain", (builder) => {
  builder.import(infrastructureModule);
  builder.import(validationModule);
  builder.bind(TaskRepositoryToken).to(InMemoryTaskRepository).singleton();
  builder.bind(TaskServiceToken).to(TaskService).scoped();
  // Bootstrap context so the root graph validates; each request overrides it in a child.
  builder.bind(RequestContextToken).toConstantValue({ requestId: "bootstrap", receivedAt: "", recordTeardown: false });
});

// ── Composition root — built once per server process ─────────────────────────────────────────────────────────────────

let rootContainer: Container | undefined;

async function getRootContainer(): Promise<Container> {
  if (!rootContainer) {
    // The polyfill has to be in place before the first container exists, and this is the only
    // place one is built — so a call site cannot forget it.
    await ensureMapPolyfill();

    const container = Container.fromModules(infrastructureModule, validationModule, domainModule);

    // Detect captive dependencies (e.g. a singleton depending on a scoped binding) up front.
    container.validate();

    // lookupBindings surfaces how many implementations back the multi-bound validator token.
    const validatorCount = container.lookupBindings(TaskValidatorToken).length;
    const log = container.resolve(ActivityLogToken);

    log.record(`registered ${validatorCount} task validators`);

    // Seed a little starting data through the resolved repository (transient id per call).
    const repository = container.resolve(TaskRepositoryToken);

    repository.add("Read the tanstack-start README", container.resolve(IdGeneratorToken).next());
    repository.add("Toggle the color scheme in the header", container.resolve(IdGeneratorToken).next());

    rootContainer = container;
  }

  return rootContainer;
}

/**
 * Stable presentation ids: binding ids are minted per registration, so rebinds and per-request
 * child bindings would give React Flow a "new" node every snapshot. A token's key does not drift,
 * and the lane keeps a child binding distinct from the root one it shadows.
 */
function stabilizeNodeIds(graph: ContainerGraphJson): ContainerGraphJson {
  const idByBinding = new Map<string, string>();
  const occurrences = new Map<string, number>();

  for (const node of graph.nodes) {
    const base = `${node.tokenKey}:${node.fromParent ? "root" : "own"}`;
    const count = occurrences.get(base) ?? 0;

    occurrences.set(base, count + 1);
    idByBinding.set(node.id, count === 0 ? base : `${base}#${String(count)}`);
  }

  return {
    nodes: graph.nodes.map((node) => ({ ...node, id: idByBinding.get(node.id) ?? node.id })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      from: idByBinding.get(edge.from) ?? edge.from,
      to: idByBinding.get(edge.to) ?? edge.to,
    })),
    includesParent: graph.includesParent,
  };
}

/** Every adapter view of the request child's wiring — its overrides plus the root chain. */
function dependencyViews(container: Container): Pick<BoardSnapshot, "graph" | "graphExports"> {
  const stable = stabilizeNodeIds(container.generateDependencyGraph({ includeParent: true }));

  return {
    graph: toReactFlowGraph(stable),
    graphExports: {
      dot: toDotGraph(stable),
      mermaid: toMermaidGraph(stable),
      cytoscape: JSON.stringify(toCytoscapeGraph(stable), undefined, 2),
      json: JSON.stringify(stable, undefined, 2),
    },
  };
}

/** Serialize `container.inspect()` into a plain, client-safe binding list. */
function describeBindings(container: Container): Array<BindingInfo> {
  return container.inspect().ownBindings.map((binding) => ({
    token: binding.tokenName,
    scope: binding.scope,
    kind: binding.kind,
  }));
}

/**
 * Run one operation inside a fresh per-request child container. Singletons (repository, activity
 * log) stay on the root; each request gets its own `RequestContext` and `TaskService`. The child is
 * disposed (async) once the request is handled, firing the service's `@preDestroy` hook.
 */
async function handleRequest(mutate?: (service: TaskService) => Array<string> | void): Promise<BoardSnapshot> {
  const root = await getRootContainer();
  const request = root.createChild();
  const context: RequestContext = {
    requestId: globalThis.crypto.randomUUID().slice(0, 8),
    receivedAt: new Date().toISOString(),
    // Loader / read-only paths still dispose the child; only mutations log the teardown.
    recordTeardown: mutate !== undefined,
  };

  request.bind(RequestContextToken).toConstantValue(context);
  // Child-owned singleton (not the root's scoped binding): published `dispose()` only deactivates
  // singletons, so a scoped instance would be cleared without running `@preDestroy`.
  request.bind(TaskServiceToken).to(TaskService).singleton();

  const service = request.resolve(TaskServiceToken);
  const validationErrors = mutate?.(service) ?? [];

  // Transient proof: two resolves from the same child yield two distinct instances.
  const first = request.resolve(IdGeneratorToken).instanceId;
  const second = request.resolve(IdGeneratorToken).instanceId;
  const transientProof: TransientProof = { first, second, distinct: first !== second };

  // Optional dependency: unbound MetricsExporter degrades to `undefined` instead of throwing.
  const metricsEnabled = root.resolveOptional(MetricsExporterToken) !== undefined;
  const bindings = describeBindings(root);

  // The graph must render the child's wiring, so it is captured before the child is disposed.
  const { graph, graphExports } = dependencyViews(request);

  // Runtime bind/unbind/rebind can invalidate the graph after boot — re-check every snapshot.
  let validated = true;

  try {
    root.validate();
  } catch {
    validated = false;
  }

  // Async-only disposal — tears down the child and runs the service's @preDestroy hook.
  await request.dispose();

  // Read state from the surviving root singletons after teardown so the log includes the teardown.
  const repository = root.resolve(TaskRepositoryToken);
  const log = root.resolve(ActivityLogToken);

  return {
    requestId: context.requestId,
    receivedAt: context.receivedAt,
    tasks: repository.list(),
    activity: log.entries(),
    graph,
    graphExports,
    validated,
    validationErrors,
    metricsEnabled,
    bindings,
    transientProof,
  };
}

// ── Input readers (TanStack Start server-fn input guards) ────────────────────────────────────────────────────────────

/** Reads a title without throwing — lets the DI validators own the add-task error reporting. */
function readTitle(input: unknown): string {
  const value = typeof input === "object" && input !== null ? (input as Record<string, unknown>).title : undefined;

  return typeof value === "string" ? value : "";
}

function readId(input: unknown): string {
  const value = typeof input === "object" && input !== null ? (input as Record<string, unknown>).id : undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error('"id" is required');
  }

  return value.trim();
}

function readEnabled(input: unknown): boolean {
  const value = typeof input === "object" && input !== null ? (input as Record<string, unknown>).enabled : undefined;

  return value === true;
}

/* ---------------------------------------------------------------------------
 * Server functions — every interaction runs through a DI-resolved service
 * ------------------------------------------------------------------------ */

export const getBoardServerFn = createServerFn().handler(async (): Promise<BoardSnapshot> => handleRequest());

export const addTaskServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown): { title: string } => ({ title: readTitle(input) }))
  .handler(async ({ data }): Promise<BoardSnapshot> => handleRequest((service) => service.add(data.title)));

export const toggleTaskServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown): { id: string } => ({ id: readId(input) }))
  .handler(async ({ data }): Promise<BoardSnapshot> => handleRequest((service) => service.toggle(data.id)));

export const removeTaskServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown): { id: string } => ({ id: readId(input) }))
  .handler(async ({ data }): Promise<BoardSnapshot> => handleRequest((service) => service.remove(data.id)));

// Demonstrates runtime `bind`/`unbind`: the optional MetricsExporter appears or disappears for
// every later resolve, and TaskService keeps working either way (`optional(...)` degrades to
// `undefined` instead of throwing).
export const setMetricsServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown): { enabled: boolean } => ({ enabled: readEnabled(input) }))
  .handler(async ({ data }): Promise<BoardSnapshot> => {
    const root = await getRootContainer();
    const log = root.resolve(ActivityLogToken);
    const bound = root.resolveOptional(MetricsExporterToken) !== undefined;

    if (data.enabled && !bound) {
      root.bind(MetricsExporterToken).to(ActivityLogMetricsExporter).singleton();
      log.record("metrics enabled · MetricsExporter bound");
    } else if (!data.enabled && bound) {
      root.unbind(MetricsExporterToken);
      log.record("metrics disabled · MetricsExporter unbound");
    }

    return handleRequest();
  });

// Demonstrates `rebind`: swap the singleton repository implementation at runtime, clearing state
// without touching any consumer of TaskRepositoryToken (ActivityLog stays put).
export const resetBoardServerFn = createServerFn({ method: "POST" }).handler(async (): Promise<BoardSnapshot> => {
  const root = await getRootContainer();
  const log = root.resolve(ActivityLogToken);

  root.rebind(TaskRepositoryToken).to(InMemoryTaskRepository).singleton();
  log.record("board reset · repository rebound");

  return handleRequest();
});
