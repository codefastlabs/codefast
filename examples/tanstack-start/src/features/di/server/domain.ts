/** The DI board's domain — tokens, services, validators, and the modules that bind them. */

import { injectAll, injectable, Module, optional, postConstruct, preDestroy, token } from "@codefast/di";

// ── Domain model ─────────────────────────────────────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Clock {
  now: () => string;
}

export interface ActivityLog {
  record: (message: string) => void;
  entries: () => Array<string>;
}

/** Mints ids; `instanceId` is unique per instance so a transient scope is observable. */
export interface IdGenerator {
  readonly instanceId: string;
  next: () => string;
}

/** A single add-task guard; returns an error message or `undefined` when the title passes. */
export interface TaskValidator {
  readonly name: string;
  validate: (title: string, existingTitles: ReadonlyArray<string>) => string | undefined;
}

/** Runs every registered TaskValidator and aggregates their messages. */
export interface TaskValidation {
  collect: (title: string, existingTitles: ReadonlyArray<string>) => Array<string>;
}

/** Optional telemetry sink — bound/unbound at runtime by the metrics toggle. */
export interface MetricsExporter {
  record: (event: string) => void;
}

export interface TaskRepository {
  list: () => Array<Task>;
  add: (title: string, id: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
}

export interface RequestContext {
  requestId: string;
  receivedAt: string;
  /** When true, `@preDestroy` records teardown into the singleton activity log. */
  recordTeardown: boolean;
}

/* ---------------------------------------------------------------------------
 * Tokens — typed keys; constructor dependencies are declared via `@injectable([...])`
 * (TC39 decorators have no parameter decorators, so the order here maps to the params).
 * ------------------------------------------------------------------------ */

export const ClockToken = token<Clock>("Clock");
export const ActivityLogToken = token<ActivityLog>("ActivityLog");
export const IdGeneratorToken = token<IdGenerator>("IdGenerator");
export const TaskValidatorToken = token<TaskValidator>("TaskValidator");
export const TaskValidationToken = token<TaskValidation>("TaskValidation");
export const MetricsExporterToken = token<MetricsExporter>("MetricsExporter");
export const TaskRepositoryToken = token<TaskRepository>("TaskRepository");
export const RequestContextToken = token<RequestContext>("RequestContext");

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
export class ActivityLogMetricsExporter implements MetricsExporter {
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
export class NonEmptyTitleValidator implements TaskValidator {
  readonly name = "non-empty";

  validate(title: string): string | undefined {
    return title.trim().length === 0 ? "Title cannot be empty." : undefined;
  }
}

@injectable()
export class MaxTitleLengthValidator implements TaskValidator {
  readonly name = "max-length";

  validate(title: string): string | undefined {
    return title.length > MAX_TITLE_LENGTH ? `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` : undefined;
  }
}

@injectable()
export class UniqueTitleValidator implements TaskValidator {
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
export class CompositeTaskValidator implements TaskValidation {
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
export class InMemoryTaskRepository implements TaskRepository {
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
export class TaskService {
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

export const TaskServiceToken = token<TaskService>("TaskService");

// ── Modules — reusable bundles of bindings ───────────────────────────────────────────────────────────────────────────

export const infrastructureModule = Module.create("infrastructure", (builder) => {
  builder.bind(ClockToken).to(SystemClock).singleton();
  builder.bind(ActivityLogToken).to(InMemoryActivityLog).singleton();
  // Transient: every resolve returns a brand-new generator instance.
  builder.bind(IdGeneratorToken).to(UuidGenerator).transient();
});

export const validationModule = Module.create("validation", (builder) => {
  // Multi-binding: same token, distinct named slots — without whenNamed, last-wins keeps only one.
  builder.bind(TaskValidatorToken).to(NonEmptyTitleValidator).whenNamed("non-empty").singleton();
  builder.bind(TaskValidatorToken).to(MaxTitleLengthValidator).whenNamed("max-length").singleton();
  builder.bind(TaskValidatorToken).to(UniqueTitleValidator).whenNamed("no-duplicate").singleton();
  builder.bind(TaskValidationToken).to(CompositeTaskValidator).singleton();
});

export const domainModule = Module.create("domain", (builder) => {
  builder.import(infrastructureModule);
  builder.import(validationModule);
  builder.bind(TaskRepositoryToken).to(InMemoryTaskRepository).singleton();
  builder.bind(TaskServiceToken).to(TaskService).scoped();
  // Bootstrap context so the root graph validates; each request overrides it in a child.
  builder.bind(RequestContextToken).toConstantValue({ requestId: "bootstrap", receivedAt: "", recordTeardown: false });
});
