/**
 * Shared descriptor for the "realistic" benchmark graph. A handful of back-end
 * services with typical reuse: one logger shared by everything, a few
 * shared leaf infrastructure services (config, metrics, cache, http client),
 * two repositories that depend on the infra, two services built on those
 * repositories, and a top-level controller that composes the services.
 *
 * This descriptor is deliberately library-agnostic — the only thing that
 * touches `@codefast/di` or `inversify` is the per-library adapter. That
 * keeps the shape of work identical across the two harnesses; any
 * measured difference comes from the resolution engine, not from
 * accidentally wiring more work on one side than the other.
 *
 * Scenarios consuming this descriptor:
 * - `realistic-graph-resolve-root` (hot path, singleton cache warm)
 * - `realistic-graph-cold-resolve` (first resolve after bind)
 * - `realistic-graph-validate` (codefast-only: static scope validation)
 *
 * @since 0.3.16-canary.0
 */

export type NodeLifetime = "singleton" | "transient";

/**
 * One constructable in the graph. `dependencies` lists *other `id`s in this
 * descriptor* — the adapter turns those into library-specific tokens and
 * wires them as factory dependencies. Leaf services have an empty array.
 *
 * We intentionally avoid using real `@injectable` classes here because the
 * two libraries have incompatible decorator runtimes; reusing the same
 * class across both would force us to pick one runtime and disadvantage
 * the other. The adapters emit factory bindings that produce a small
 * value object — we care about the resolver engine, not constructor
 * semantics.
 *
 * @since 0.3.16-canary.0
 */
export interface NodeDescriptor {
  readonly id: string;
  readonly lifetime: NodeLifetime;
  readonly dependencies: ReadonlyArray<string>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface GraphDescriptor {
  readonly nodes: ReadonlyArray<NodeDescriptor>;
  readonly rootId: string;
}

/**
 * 10 nodes, max depth 4, max fan-in 8 (LoggerService), root fan-out 3.
 * Aligns with what a small-to-medium real app looks like, with enough
 * reuse that resolver cache behaviour matters and enough depth that
 * factory-chain call overhead is visible.
 *
 * @since 0.3.16-canary.0
 */
export const REALISTIC_GRAPH: GraphDescriptor = {
  rootId: "ApiController",
  nodes: [
    { id: "LoggerService", lifetime: "singleton", dependencies: [] },
    { id: "ConfigService", lifetime: "singleton", dependencies: [] },
    { id: "MetricsService", lifetime: "singleton", dependencies: ["LoggerService"] },
    {
      id: "CacheService",
      lifetime: "singleton",
      dependencies: ["LoggerService", "ConfigService"],
    },
    {
      id: "HttpClient",
      lifetime: "singleton",
      dependencies: ["LoggerService", "ConfigService"],
    },
    {
      id: "UserRepository",
      lifetime: "singleton",
      dependencies: ["HttpClient", "CacheService", "LoggerService"],
    },
    {
      id: "OrderRepository",
      lifetime: "singleton",
      dependencies: ["HttpClient", "CacheService", "LoggerService"],
    },
    {
      id: "UserService",
      lifetime: "singleton",
      dependencies: ["UserRepository", "MetricsService", "LoggerService"],
    },
    {
      id: "OrderService",
      lifetime: "singleton",
      dependencies: ["OrderRepository", "UserService", "MetricsService", "LoggerService"],
    },
    {
      id: "ApiController",
      // Transient at the root mirrors the typical "one controller per
      // request" shape — even when the underlying services are singletons.
      lifetime: "transient",
      dependencies: ["OrderService", "UserService", "LoggerService"],
    },
  ],
};

/**
 * Resolved instance shape the adapters construct. Small enough to be
 * free-ish to allocate, large enough that we're not just measuring
 * `Object.create`. Adapters should use this exact shape so cross-library
 * sanity checks can deep-equal the resolved root.
 *
 * @since 0.3.16-canary.0
 */
export interface RealisticNode {
  readonly __id: string;
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
}

/**
 * Lists node ids in topological order (leaves first). Used by adapters
 * that can't rely on the descriptor's natural order (inversify in
 * particular needs no special care, but codefast's `validate()` runs
 * checks independent of declaration order — sorting keeps the two
 * adapters trivially comparable).
 *
 * @since 0.3.16-canary.0
 */
export function topologicallyOrderedNodeIds(graph: GraphDescriptor): ReadonlyArray<string> {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const ordered: Array<string> = [];

  function visit(nodeId: string): void {
    if (visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);
    const node = nodesById.get(nodeId);
    if (node === undefined) {
      throw new Error(`Unknown node id referenced in realistic graph: ${nodeId}`);
    }
    for (const dependencyId of node.dependencies) {
      visit(dependencyId);
    }
    ordered.push(nodeId);
  }

  for (const node of graph.nodes) {
    visit(node.id);
  }
  return ordered;
}

/**
 * Cheap consistency check. Run at adapter-build time to catch descriptor
 * typos before tinybench starts measuring noise.
 *
 * @since 0.3.16-canary.0
 */
export function assertGraphIsWellFormed(graph: GraphDescriptor): void {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (!nodeIds.has(graph.rootId)) {
    throw new Error(`Graph rootId "${graph.rootId}" is not one of the declared nodes.`);
  }
  for (const node of graph.nodes) {
    for (const dependencyId of node.dependencies) {
      if (!nodeIds.has(dependencyId)) {
        throw new Error(
          `Node "${node.id}" depends on unknown node "${dependencyId}". Descriptor typo?`,
        );
      }
      if (dependencyId === node.id) {
        throw new Error(`Node "${node.id}" depends on itself. Descriptor typo?`);
      }
    }
  }
}
