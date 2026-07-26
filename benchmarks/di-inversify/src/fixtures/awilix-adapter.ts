/**
 * Awilix adapter for the shared realistic-graph descriptor.
 *
 * Mirrors {@link ../fixtures/inversify-adapter.ts}: same node identities,
 * same factory semantics via `asFunction`, same scope mapping. Awilix is
 * decorator-free, so the graph is wired with plain factory registrations —
 * keeping the shape of work identical to every other adapter.
 */
import type { AwilixContainer } from "awilix";
import { asFunction, createContainer, InjectionMode, Lifetime } from "awilix";

import {
  assertGraphIsWellFormed,
  type GraphDescriptor,
  type NodeDescriptor,
  type RealisticNode,
  topologicallyOrderedNodeIds,
} from "#/fixtures/realistic-graph";

/**
 * A built container plus every registration name, retained so sanity checks
 * can resolve any node. Scenarios typically only need `rootName` + `container`.
 *
 * @since 0.5.0-canary.7
 */
export interface AwilixRealisticBuild {
  readonly container: AwilixContainer;
  readonly rootName: string;
  readonly namesById: ReadonlyMap<string, string>;
}

function bindOneNode(container: AwilixContainer, node: NodeDescriptor, namesById: ReadonlyMap<string, string>): void {
  const nodeName = namesById.get(node.id);
  if (nodeName === undefined) {
    throw new Error(`Awilix adapter: name missing for node "${node.id}"`);
  }
  const dependencyNames = node.dependencies.map((dependencyId) => {
    const dependencyName = namesById.get(dependencyId);
    if (dependencyName === undefined) {
      throw new Error(`Awilix adapter: dependency name missing for "${node.id}" -> "${dependencyId}"`);
    }
    return dependencyName;
  });

  const factory = (): RealisticNode => {
    const resolvedDependencies: Array<RealisticNode> = [];
    for (const dependencyName of dependencyNames) {
      resolvedDependencies.push(container.resolve<RealisticNode>(dependencyName));
    }
    return { __id: node.id, resolvedDependencies };
  };

  container.register(
    nodeName,
    asFunction(factory, {
      lifetime: node.lifetime === "singleton" ? Lifetime.SINGLETON : Lifetime.TRANSIENT,
    }),
  );
}

/**
 * Builds a fresh awilix container from the descriptor. Use per-iteration for
 * `realistic-graph-cold-resolve`, or once in scenario setup for hot paths.
 *
 * @since 0.5.0-canary.7
 */
export function buildAwilixRealisticContainer(graph: GraphDescriptor): AwilixRealisticBuild {
  assertGraphIsWellFormed(graph);

  const container = createContainer({ injectionMode: InjectionMode.PROXY });
  const namesById = new Map<string, string>();
  for (const nodeId of topologicallyOrderedNodeIds(graph)) {
    namesById.set(nodeId, `realistic:${nodeId}`);
  }
  for (const node of graph.nodes) {
    bindOneNode(container, node, namesById);
  }
  const rootName = namesById.get(graph.rootId);
  if (rootName === undefined) {
    throw new Error(`Awilix adapter: root name missing for "${graph.rootId}"`);
  }
  return { container, rootName, namesById };
}

/**
 * Sanity helper: resolves the root and asserts the expected shape.
 *
 * @since 0.5.0-canary.7
 */
export function sanityCheckAwilixRealisticResolve(graph: GraphDescriptor): boolean {
  const { container, rootName } = buildAwilixRealisticContainer(graph);
  const resolved = container.resolve<RealisticNode>(rootName);
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}
