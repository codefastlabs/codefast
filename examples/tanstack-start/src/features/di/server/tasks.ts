/** The DI board's server functions — per-request child containers over the shared domain modules. */

import { Container } from "@codefast/di";
import type { ContainerGraphJson } from "@codefast/di";
import { toCytoscapeGraph } from "@codefast/di/graph-adapters/cytoscape";
import { toDotGraph } from "@codefast/di/graph-adapters/dot";
import { toMermaidGraph } from "@codefast/di/graph-adapters/mermaid";
import { toReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { createServerFn } from "@tanstack/react-start";

import {
  ActivityLogMetricsExporter,
  ActivityLogToken,
  domainModule,
  IdGeneratorToken,
  InMemoryTaskRepository,
  infrastructureModule,
  MetricsExporterToken,
  RequestContextToken,
  TaskRepositoryToken,
  TaskService,
  TaskServiceToken,
  TaskValidatorToken,
  validationModule,
} from "#/features/di/server/domain";
import type { RequestContext, Task } from "#/features/di/server/domain";

// ── Presentation model ───────────────────────────────────────────────────────────────────────────────────────────────

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

// ── Composition root — built once per server process ─────────────────────────────────────────────────────────────────

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
 * Runs one operation inside a fresh per-request child container. Singletons (repository, activity
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
    const root = getRootContainer();
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
  const root = getRootContainer();
  const log = root.resolve(ActivityLogToken);

  root.rebind(TaskRepositoryToken).to(InMemoryTaskRepository).singleton();
  log.record("board reset · repository rebound");

  return handleRequest();
});
