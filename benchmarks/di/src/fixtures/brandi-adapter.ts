/**
 * Brandi adapter for the shared realistic-graph descriptor.
 *
 * Mirrors `../fixtures/tsyringe-adapter.ts`: same node identities, same factory
 * semantics, same scope mapping. Brandi is decorator-free and token-based, so
 * each node binds a plain factory via `toInstance()` in its lifetime scope —
 * keeping the shape of work identical to every other adapter.
 */
import type { Container, Token } from "brandi";
import { createContainer, token } from "brandi";

import { assertGraphIsWellFormed, topologicallyOrderedNodeIds } from "#/fixtures/realistic-graph";
import type { GraphDescriptor, NodeDescriptor, RealisticNode } from "#/fixtures/realistic-graph";

/**
 * A built container plus every registration token, retained so sanity checks
 * can resolve any node. Scenarios typically only need `rootToken` + `container`.
 */
export interface BrandiRealisticBuild {
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
    throw new Error(`Brandi adapter: token missing for node "${node.id}"`);
  }
  const dependencyTokens = node.dependencies.map((dependencyId) => {
    const dependencyToken = tokensById.get(dependencyId);
    if (dependencyToken === undefined) {
      throw new Error(`Brandi adapter: dependency token missing for "${node.id}" -> "${dependencyId}"`);
    }
    return dependencyToken;
  });

  const factory = (): RealisticNode => {
    const resolvedDependencies: Array<RealisticNode> = [];
    for (const dependencyToken of dependencyTokens) {
      resolvedDependencies.push(container.get(dependencyToken));
    }
    return { __id: node.id, resolvedDependencies };
  };

  const scope = container.bind(nodeToken).toInstance(factory);
  if (node.lifetime === "singleton") {
    scope.inSingletonScope();
  } else {
    scope.inTransientScope();
  }
}

/**
 * Builds a fresh brandi container from the descriptor. Use per-iteration for
 * `realistic-graph-cold-resolve`, or once in scenario setup for hot paths.
 */
export function buildBrandiRealisticContainer(graph: GraphDescriptor): BrandiRealisticBuild {
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
    throw new Error(`Brandi adapter: root token missing for "${graph.rootId}"`);
  }
  return { container, rootToken, tokensById };
}

/**
 * Sanity helper: resolves the root and asserts the expected shape.
 */
export function sanityCheckBrandiRealisticResolve(graph: GraphDescriptor): boolean {
  const { container, rootToken } = buildBrandiRealisticContainer(graph);
  const resolved = container.get(rootToken);
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}
