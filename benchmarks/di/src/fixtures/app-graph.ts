/**
 * The application graph the app-boot row builds, and the sanity every library's build of it shares.
 */
import type { NodeDescriptor, RealisticNode } from "#fixtures/realistic-graph";

/**
 * A graph with several entry points: every node in dependency order, and the handlers a boot resolves.
 *
 * @since 0.11.0
 */
export interface AppGraphDescriptor {
  readonly nodes: ReadonlyArray<NodeDescriptor>;
  readonly handlerIds: ReadonlyArray<string>;
}

const REPOSITORY_COUNT = 12;
const SERVICE_COUNT = 16;
const HANDLER_COUNT = 8;

function appGraph(): AppGraphDescriptor {
  const repository = (index: number): string => `Repository${String(index % REPOSITORY_COUNT)}`;
  const service = (index: number): string => `Service${String(index)}`;
  const nodes: Array<NodeDescriptor> = [
    { id: "Logger", lifetime: "singleton", dependencies: [] },
    { id: "Config", lifetime: "singleton", dependencies: [] },
    { id: "DbPool", lifetime: "singleton", dependencies: ["Logger", "Config"] },
    { id: "Cache", lifetime: "singleton", dependencies: ["Logger", "Config"] },
  ];
  for (let index = 0; index < REPOSITORY_COUNT; index += 1) {
    nodes.push({ id: repository(index), lifetime: "singleton", dependencies: ["DbPool", "Cache", "Logger"] });
  }
  for (let index = 0; index < SERVICE_COUNT; index += 1) {
    // Every fourth service also composes the one before it, so the graph is deeper than three layers.
    const composed = index % 4 === 3 ? [service(index - 1)] : [];
    nodes.push({
      id: service(index),
      lifetime: "singleton",
      dependencies: [repository(index), repository(index + 5), "Logger", ...composed],
    });
  }
  const handlerIds: Array<string> = [];
  for (let index = 0; index < HANDLER_COUNT; index += 1) {
    const id = `Handler${String(index)}`;
    handlerIds.push(id);
    nodes.push({ id, lifetime: "transient", dependencies: [service(2 * index), service(2 * index + 1), "Logger"] });
  }
  return { nodes, handlerIds };
}

/**
 * Forty services an application registers at startup: infrastructure, repositories and services as singletons, and
 * the request handlers transient.
 *
 * @since 0.11.0
 */
export const APP_GRAPH: AppGraphDescriptor = appGraph();

/**
 * Whether two passes over every handler carry the descriptor's exact shape and lifetimes.
 *
 * @remarks One singleton registry spans both passes and every handler, so a singleton built twice anywhere in the
 * container reads as a broken graph, and each handler must be fresh per resolve.
 *
 * @since 0.11.0
 */
export function isAppGraphWellFormed(
  graph: AppGraphDescriptor,
  first: ReadonlyArray<RealisticNode>,
  second: ReadonlyArray<RealisticNode>,
): boolean {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const singletons = new Map<string, RealisticNode>();

  const walk = (node: RealisticNode): boolean => {
    const descriptor = nodesById.get(node.__id);
    if (descriptor === undefined) {
      return false;
    }
    if (descriptor.lifetime === "singleton") {
      const earlier = singletons.get(node.__id);
      if (earlier === undefined) {
        singletons.set(node.__id, node);
      } else if (earlier !== node) {
        return false;
      }
    }
    if (node.resolvedDependencies.length !== descriptor.dependencies.length) {
      return false;
    }
    return node.resolvedDependencies.every(
      (dependency, index) => dependency.__id === descriptor.dependencies[index] && walk(dependency),
    );
  };

  return graph.handlerIds.every((id, index) => {
    const fromFirst = first[index];
    const fromSecond = second[index];
    return (
      fromFirst !== undefined &&
      fromSecond !== undefined &&
      fromFirst !== fromSecond &&
      fromFirst.__id === id &&
      walk(fromFirst) &&
      walk(fromSecond)
    );
  });
}

/**
 * A class for one node, as an application writes it with no container in view: it keeps its constructor arguments.
 *
 * @since 0.11.0
 */
export type AppNodeClass = new (...resolved: Array<RealisticNode>) => RealisticNode;

/**
 * Creates the plain class of one node, for a library to wire with its own decorators or registration.
 *
 * @since 0.11.0
 */
export function appNodeClass(id: string): AppNodeClass {
  return class AppNode implements RealisticNode {
    readonly __id = id;
    readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
    constructor(...resolved: Array<RealisticNode>) {
      this.resolvedDependencies = resolved;
    }
  };
}
