import { Container, Module, injectable, postConstruct, token } from "@codefast/di";
import { toDotGraph } from "@codefast/di/graph-adapters/dot";
import { createServerFn } from "@tanstack/react-start";

/* ---------------------------------------------------------------------------
 * Domain model
 * ------------------------------------------------------------------------ */

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface BoardSnapshot {
  /** Id of the per-request scoped instance — changes on every server round-trip. */
  requestId: string;
  receivedAt: string;
  tasks: Array<Task>;
  /** Append-only log from the singleton ActivityLog — survives across requests. */
  activity: Array<string>;
  /** DOT description of the container's dependency graph (introspection). */
  graph: string;
}

interface Clock {
  now: () => string;
}

interface ActivityLog {
  record: (message: string) => void;
  entries: () => Array<string>;
}

interface TaskRepository {
  list: () => Array<Task>;
  add: (title: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
}

interface RequestContext {
  requestId: string;
  receivedAt: string;
}

/* ---------------------------------------------------------------------------
 * Tokens — typed keys; constructor dependencies are declared via `@injectable([...])`
 * (TC39 decorators have no parameter decorators, so the order here maps to the params).
 * ------------------------------------------------------------------------ */

const ClockToken = token<Clock>("Clock");
const ActivityLogToken = token<ActivityLog>("ActivityLog");
const TaskRepositoryToken = token<TaskRepository>("TaskRepository");
const RequestContextToken = token<RequestContext>("RequestContext");

/* ---------------------------------------------------------------------------
 * Infrastructure (singletons)
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

  add(title: string): void {
    const task: Task = { id: globalThis.crypto.randomUUID(), title, done: false, createdAt: this.#clock.now() };

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

@injectable([TaskRepositoryToken, ActivityLogToken, RequestContextToken])
class TaskService {
  readonly #repository: TaskRepository;
  readonly #log: ActivityLog;
  readonly #context: RequestContext;

  constructor(repository: TaskRepository, log: ActivityLog, context: RequestContext) {
    this.#repository = repository;
    this.#log = log;
    this.#context = context;
  }

  add(title: string): void {
    this.#repository.add(title);
  }

  toggle(id: string): void {
    this.#repository.toggle(id);
  }

  remove(id: string): void {
    this.#repository.remove(id);
  }

  read(): Omit<BoardSnapshot, "graph"> {
    return {
      requestId: this.#context.requestId,
      receivedAt: this.#context.receivedAt,
      tasks: this.#repository.list(),
      activity: this.#log.entries(),
    };
  }
}

const TaskServiceToken = token<TaskService>("TaskService");

/* ---------------------------------------------------------------------------
 * Modules — reusable bundles of bindings
 * ------------------------------------------------------------------------ */

const infrastructureModule = Module.create("infrastructure", (builder) => {
  builder.bind(ClockToken).to(SystemClock).singleton();
  builder.bind(ActivityLogToken).to(InMemoryActivityLog).singleton();
});

const domainModule = Module.create("domain", (builder) => {
  builder.import(infrastructureModule);
  builder.bind(TaskRepositoryToken).to(InMemoryTaskRepository).singleton();
  builder.bind(TaskServiceToken).to(TaskService).scoped();
  // Bootstrap context so the root graph validates; each request overrides it in a child.
  builder.bind(RequestContextToken).toConstantValue({ requestId: "bootstrap", receivedAt: "" });
});

/* ---------------------------------------------------------------------------
 * Composition root — built once per server process
 * ------------------------------------------------------------------------ */

let rootContainer: Container | undefined;

function getRootContainer(): Container {
  if (!rootContainer) {
    const container = Container.fromModules(infrastructureModule, domainModule);

    // Detect captive dependencies (e.g. a singleton depending on a scoped binding) up front.
    container.validate();

    // Seed a little starting data through the resolved repository.
    const repository = container.resolve(TaskRepositoryToken);

    repository.add("Read the start-demo README");
    repository.add("Toggle the color scheme in the header");

    rootContainer = container;
  }

  return rootContainer;
}

function dependencyGraph(): string {
  return toDotGraph(getRootContainer().generateDependencyGraph());
}

/**
 * Run one operation inside a fresh per-request child container. The scoped `TaskService` is
 * rebuilt per request with a request-unique `RequestContext`, while the singleton repository and
 * activity log are shared from the root.
 */
function handleRequest(mutate?: (service: TaskService) => void): BoardSnapshot {
  const request = getRootContainer().createChild();

  request.bind(RequestContextToken).toConstantValue({
    requestId: globalThis.crypto.randomUUID().slice(0, 8),
    receivedAt: new Date().toISOString(),
  });

  const service = request.resolve(TaskServiceToken);

  mutate?.(service);

  return { ...service.read(), graph: dependencyGraph() };
}

/* ---------------------------------------------------------------------------
 * Validators (TanStack Start server-fn input guards)
 * ------------------------------------------------------------------------ */

function readField(input: unknown, key: string): string {
  const value = typeof input === "object" && input !== null ? (input as Record<string, unknown>)[key] : undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`"${key}" is required`);
  }

  return value.trim();
}

/* ---------------------------------------------------------------------------
 * Server functions — every interaction runs through a DI-resolved service
 * ------------------------------------------------------------------------ */

export const getBoardServerFn = createServerFn().handler((): BoardSnapshot => handleRequest());

export const addTaskServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown): { title: string } => ({ title: readField(input, "title").slice(0, 80) }))
  .handler(({ data }): BoardSnapshot => handleRequest((service) => service.add(data.title)));

export const toggleTaskServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown): { id: string } => ({ id: readField(input, "id") }))
  .handler(({ data }): BoardSnapshot => handleRequest((service) => service.toggle(data.id)));

export const removeTaskServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown): { id: string } => ({ id: readField(input, "id") }))
  .handler(({ data }): BoardSnapshot => handleRequest((service) => service.remove(data.id)));

// Demonstrates `rebind`: swap the singleton repository implementation at runtime, clearing state
// without touching any consumer of TaskRepositoryToken.
export const resetBoardServerFn = createServerFn({ method: "POST" }).handler((): BoardSnapshot => {
  getRootContainer().rebind(TaskRepositoryToken).to(InMemoryTaskRepository).singleton();

  return handleRequest();
});
