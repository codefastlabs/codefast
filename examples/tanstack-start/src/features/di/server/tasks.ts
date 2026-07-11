// Side-effect import: install the Map.prototype.getOrInsert polyfill before @codefast/di loads.
import "#/features/di/server/map-get-or-insert";
import { Container, injectAll, injectable, Module, optional, postConstruct, preDestroy, token } from "@codefast/di";
import type { ContainerGraphJson } from "@codefast/di";
import { toDotGraph } from "@codefast/di/graph-adapters/dot";
import { toReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { createServerFn } from "@tanstack/react-start";

/* ---------------------------------------------------------------------------
 * Domain model
 * ------------------------------------------------------------------------ */

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
  /** React Flow nodes/edges from `toReactFlowGraph(generateDependencyGraph())`. */
  graph: ReactFlowGraph;
  /** Graphviz DOT source from `toDotGraph(generateDependencyGraph())`. */
  graphDot: string;
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

/** Optional telemetry sink — absent in this demo to show graceful degradation. */
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

/* ---------------------------------------------------------------------------
 * Infrastructure (singletons + a transient id generator)
 * ------------------------------------------------------------------------ */

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

/* ---------------------------------------------------------------------------
 * Repository (singleton — task state persists across requests)
 * ------------------------------------------------------------------------ */

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

/* ---------------------------------------------------------------------------
 * Modules — reusable bundles of bindings
 * ------------------------------------------------------------------------ */

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

/* ---------------------------------------------------------------------------
 * Composition root — built once per server process
 * ------------------------------------------------------------------------ */

let rootContainer: Container | undefined;

function getRootContainer(): Container {
  if (!rootContainer) {
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
 * Patch injectAll multi-binding edges so TaskValidation links to every validator
 * (`buildDependencyGraph` only wires the first). Named slot labels replace opaque
 * `[0]` constructor-index labels. Applied on the JSON graph so React Flow and DOT stay in sync.
 */
function expandInjectAllEdges(graph: ContainerGraphJson): ContainerGraphJson {
  const container = getRootContainer();
  const validation = graph.nodes.find((node) => node.tokenName === "TaskValidation");

  if (validation === undefined) {
    return graph;
  }

  // BindingIdentifier is a branded string at compile time; graph ids are plain strings.
  const validatorById = new Map(
    container.lookupBindings(TaskValidatorToken).map((binding) => [String(binding.id), binding] as const),
  );
  const linked = new Set<string>();
  const edges: Array<ContainerGraphJson["edges"][number]> = [];

  for (const edge of graph.edges) {
    if (edge.from !== validation.id || !validatorById.has(edge.to)) {
      edges.push(edge);
      continue;
    }

    linked.add(edge.to);
    const name = validatorById.get(edge.to)?.slot.name;

    edges.push({
      from: edge.from,
      to: edge.to,
      ...(name !== undefined ? { label: `name:${name}` } : {}),
    });
  }

  for (const [id, binding] of validatorById) {
    if (linked.has(id)) {
      continue;
    }

    const name = binding.slot.name;

    edges.push({
      from: validation.id,
      to: id,
      ...(name !== undefined ? { label: `name:${name}` } : {}),
    });
  }

  return { nodes: graph.nodes, edges, includesParent: graph.includesParent };
}

/** React Flow + DOT views from the same patched dependency graph. */
function dependencyViews(): { graph: ReactFlowGraph; graphDot: string } {
  const patched = expandInjectAllEdges(getRootContainer().generateDependencyGraph());

  return {
    graph: toReactFlowGraph(patched),
    graphDot: toDotGraph(patched),
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
  const root = getRootContainer();
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

  // Async-only disposal — tears down the child and runs the service's @preDestroy hook.
  await request.dispose();

  // Read state from the surviving root singletons after teardown so the log includes the teardown.
  const repository = root.resolve(TaskRepositoryToken);
  const log = root.resolve(ActivityLogToken);

  const { graph, graphDot } = dependencyViews();

  return {
    requestId: context.requestId,
    receivedAt: context.receivedAt,
    tasks: repository.list(),
    activity: log.entries(),
    graph,
    graphDot,
    validationErrors,
    metricsEnabled,
    bindings,
    transientProof,
  };
}

/* ---------------------------------------------------------------------------
 * Input readers (TanStack Start server-fn input guards)
 * ------------------------------------------------------------------------ */

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

// Demonstrates `rebind`: swap the singleton repository implementation at runtime, clearing state
// without touching any consumer of TaskRepositoryToken (ActivityLog stays put).
export const resetBoardServerFn = createServerFn({ method: "POST" }).handler(async (): Promise<BoardSnapshot> => {
  const root = getRootContainer();
  const log = root.resolve(ActivityLogToken);

  root.rebind(TaskRepositoryToken).to(InMemoryTaskRepository).singleton();
  log.record("board reset · repository rebound");

  return handleRequest();
});
