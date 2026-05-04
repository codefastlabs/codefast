/**
 * Codefast/DI adapter for the shared realistic-graph descriptor.
 *
 * Turns the library-agnostic descriptor into a live `Container` whose
 * root token resolves to a tree of value objects identical in shape to
 * the inversify adapter's output. The bindings use `toDynamic` + scope
 * (not decorated classes) so that what we measure is the resolver's
 * binding lookup + factory invocation + scope caching, not the
 * class-instantiation machinery — which is covered separately by the
 * dedicated `boot` scenarios.
 */
import type { Container as CodefastContainer, Token } from "@codefast/di";
import { Container, token } from "@codefast/di";
import {
  assertGraphIsWellFormed,
  type GraphDescriptor,
  type NodeDescriptor,
  type RealisticNode,
  topologicallyOrderedNodeIds,
} from "#/fixtures/realistic-graph";

/**
 * A built container plus every token, retained so scenarios can resolve
 * any node (not just the root). Scenarios typically only touch `rootToken`
 * and `container`, but having the full map is useful for sanity asserts.
 *
 * @since 0.3.16-canary.0
 */
export interface CodefastRealisticBuild {
  readonly container: CodefastContainer;
  readonly rootToken: Token<RealisticNode>;
  readonly tokensById: ReadonlyMap<string, Token<RealisticNode>>;
}

function bindOneNode(
  container: CodefastContainer,
  node: NodeDescriptor,
  tokensById: ReadonlyMap<string, Token<RealisticNode>>,
): void {
  const nodeToken = tokensById.get(node.id);
  if (nodeToken === undefined) {
    throw new Error(`Codefast adapter: token missing for node "${node.id}"`);
  }
  // Capture dependency tokens once so the closure doesn't re-look them up
  // per resolve — the V8 shape for this closure stays monomorphic.
  const dependencyTokens = node.dependencies.map((dependencyId) => {
    const dependencyToken = tokensById.get(dependencyId);
    if (dependencyToken === undefined) {
      throw new Error(
        `Codefast adapter: dependency token missing for "${node.id}" -> "${dependencyId}"`,
      );
    }
    return dependencyToken;
  });

  const binding = container.bind(nodeToken).toDynamic((resolutionContext): RealisticNode => {
    const resolvedDependencies: RealisticNode[] = [];
    for (const dependencyToken of dependencyTokens) {
      resolvedDependencies.push(resolutionContext.resolve(dependencyToken));
    }
    return {
      __id: node.id,
      resolvedDependencies,
    };
  });

  if (node.lifetime === "singleton") {
    binding.singleton();
  } else {
    binding.transient();
  }
}

/**
 * Builds a fresh container from the descriptor. Sub-millisecond on a warm
 * process; call this per iteration for `realistic-graph-cold-resolve`, or
 * once in scenario setup for hot-path scenarios.
 *
 * @since 0.3.16-canary.0
 */
export function buildCodefastRealisticContainer(graph: GraphDescriptor): CodefastRealisticBuild {
  assertGraphIsWellFormed(graph);

  const container = Container.create();
  const tokensById = new Map<string, Token<RealisticNode>>();
  for (const nodeId of topologicallyOrderedNodeIds(graph)) {
    tokensById.set(nodeId, token<RealisticNode>(`realistic:${nodeId}`));
  }
  for (const node of graph.nodes) {
    bindOneNode(container, node, tokensById);
  }
  const rootToken = tokensById.get(graph.rootId);
  if (rootToken === undefined) {
    throw new Error(`Codefast adapter: root token missing for "${graph.rootId}"`);
  }
  return { container, rootToken, tokensById };
}

/**
 * Sanity helper: resolves the root and asserts the expected shape. Used
 * by scenarios as their sanity check so bench measurement never starts
 * against a silently-broken graph.
 *
 * @since 0.3.16-canary.0
 */
export function sanityCheckCodefastRealisticResolve(graph: GraphDescriptor): boolean {
  const { container, rootToken } = buildCodefastRealisticContainer(graph);
  const resolved = container.resolve(rootToken);
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}
