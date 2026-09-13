/**
 * Ditox adapter for the shared realistic-graph descriptor.
 *
 * Mirrors `../fixtures/tsyringe-adapter.ts`: same node identities, same factory
 * semantics, same scope mapping. Ditox is functional and token-based; each node
 * binds an `injectable()` factory whose dependency tokens ditox resolves before
 * the call — keeping the shape of work identical to every other adapter.
 */
import type { Container, Token } from "ditox";
import { createContainer, injectable, token } from "ditox";

import { assertGraphIsWellFormed, topologicallyOrderedNodeIds } from "#/fixtures/realistic-graph";
import type { GraphDescriptor, NodeDescriptor, RealisticNode } from "#/fixtures/realistic-graph";

/**
 * A built container plus every registration token, retained so sanity checks
 * can resolve any node. Scenarios typically only need `rootToken` + `container`.
 *
 * @since 0.8.0
 */
export interface DitoxRealisticBuild {
  readonly container: Container;
  readonly rootToken: Token<RealisticNode>;
  readonly tokensById: ReadonlyMap<string, Token<RealisticNode>>;
}

function bindOneNode(
  container: Container,
  node: NodeDescriptor,
  tokensById: ReadonlyMap<string, Token<RealisticNode>>,
): void {
  const nodeToken = tokensById.get(node.id);
  if (nodeToken === undefined) {
    throw new Error(`Ditox adapter: token missing for node "${node.id}"`);
  }
  const dependencyTokens = node.dependencies.map((dependencyId) => {
    const dependencyToken = tokensById.get(dependencyId);
    if (dependencyToken === undefined) {
      throw new Error(`Ditox adapter: dependency token missing for "${node.id}" -> "${dependencyId}"`);
    }
    return dependencyToken;
  });

  const factory = injectable(
    (...resolvedDependencies: Array<RealisticNode>): RealisticNode => ({ __id: node.id, resolvedDependencies }),
    ...dependencyTokens,
  );

  container.bindFactory(nodeToken, factory, { scope: node.lifetime === "singleton" ? "singleton" : "transient" });
}

/**
 * Builds a fresh ditox container from the descriptor. Use per-iteration for
 * `realistic-graph-cold-resolve`, or once in scenario setup for hot paths.
 *
 * @since 0.8.0
 */
export function buildDitoxRealisticContainer(graph: GraphDescriptor): DitoxRealisticBuild {
  assertGraphIsWellFormed(graph);

  const container = createContainer();
  const tokensById = new Map<string, Token<RealisticNode>>();
  for (const nodeId of topologicallyOrderedNodeIds(graph)) {
    tokensById.set(nodeId, token<RealisticNode>(`realistic:${nodeId}`));
  }
  for (const node of graph.nodes) {
    bindOneNode(container, node, tokensById);
  }
  const rootToken = tokensById.get(graph.rootId);
  if (rootToken === undefined) {
    throw new Error(`Ditox adapter: root token missing for "${graph.rootId}"`);
  }
  return { container, rootToken, tokensById };
}

/**
 * Sanity helper: resolves the root and asserts the expected shape.
 *
 * @since 0.8.0
 */
export function sanityCheckDitoxRealisticResolve(graph: GraphDescriptor): boolean {
  const { container, rootToken } = buildDitoxRealisticContainer(graph);
  const resolved = container.resolve(rootToken);
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}
