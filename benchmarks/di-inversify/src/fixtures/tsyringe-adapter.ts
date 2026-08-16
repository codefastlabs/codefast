/**
 * tsyringe adapter for the shared realistic-graph descriptor.
 *
 * Mirrors `../fixtures/inversify-adapter.ts`: same node identities,
 * same factory semantics, same scope mapping. tsyringe factory providers
 * don't cache, so singleton nodes wrap their factory in `instanceCachingFactory`
 * while transient nodes use a plain `useFactory` — keeping the graph
 * decorator-free and apples-to-apples with every other adapter.
 */
import "reflect-metadata";
import type { DependencyContainer } from "tsyringe";
import { container as rootContainer, instanceCachingFactory } from "tsyringe";

import {
  assertGraphIsWellFormed,
  type GraphDescriptor,
  type NodeDescriptor,
  type RealisticNode,
  topologicallyOrderedNodeIds,
} from "#/fixtures/realistic-graph";

/**
 * A built child container plus every registration token, retained so sanity
 * checks can resolve any node. Scenarios typically only need `rootToken` +
 * `container`.
 *
 * @since 0.5.0-canary.7
 */
export interface TsyringeRealisticBuild {
  readonly container: DependencyContainer;
  readonly rootToken: symbol;
  readonly tokensById: ReadonlyMap<string, symbol>;
}

function bindOneNode(
  container: DependencyContainer,
  node: NodeDescriptor,
  tokensById: ReadonlyMap<string, symbol>,
): void {
  const nodeToken = tokensById.get(node.id);
  if (nodeToken === undefined) {
    throw new Error(`tsyringe adapter: token missing for node "${node.id}"`);
  }
  const dependencyTokens = node.dependencies.map((dependencyId) => {
    const dependencyToken = tokensById.get(dependencyId);
    if (dependencyToken === undefined) {
      throw new Error(`tsyringe adapter: dependency token missing for "${node.id}" -> "${dependencyId}"`);
    }
    return dependencyToken;
  });

  const factory = (dependencyContainer: DependencyContainer): RealisticNode => {
    const resolvedDependencies: Array<RealisticNode> = [];
    for (const dependencyToken of dependencyTokens) {
      resolvedDependencies.push(dependencyContainer.resolve<RealisticNode>(dependencyToken));
    }
    return { __id: node.id, resolvedDependencies };
  };

  container.register<RealisticNode>(nodeToken, {
    useFactory: node.lifetime === "singleton" ? instanceCachingFactory(factory) : factory,
  });
}

/**
 * Builds a fresh child container from the descriptor. A child keeps each
 * build's registrations isolated from the shared root container.
 *
 * @since 0.5.0-canary.7
 */
export function buildTsyringeRealisticContainer(graph: GraphDescriptor): TsyringeRealisticBuild {
  assertGraphIsWellFormed(graph);

  const container = rootContainer.createChildContainer();
  const tokensById = new Map<string, symbol>();
  for (const nodeId of topologicallyOrderedNodeIds(graph)) {
    tokensById.set(nodeId, Symbol(`realistic:${nodeId}`));
  }
  for (const node of graph.nodes) {
    bindOneNode(container, node, tokensById);
  }
  const rootToken = tokensById.get(graph.rootId);
  if (rootToken === undefined) {
    throw new Error(`tsyringe adapter: root token missing for "${graph.rootId}"`);
  }
  return { container, rootToken, tokensById };
}

/**
 * Sanity helper: resolves the root and asserts the expected shape.
 *
 * @since 0.5.0-canary.7
 */
export function sanityCheckTsyringeRealisticResolve(graph: GraphDescriptor): boolean {
  const { container, rootToken } = buildTsyringeRealisticContainer(graph);
  const resolved = container.resolve<RealisticNode>(rootToken);
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}
