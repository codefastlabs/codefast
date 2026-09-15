/**
 * The sanity every class-lane realistic row shares: the resolved tree matches the descriptor node
 * for node, singletons are one instance wherever they appear, and the root is fresh per resolve.
 */
import type { GraphDescriptor, RealisticNode } from "#/fixtures/realistic-graph";

/**
 * Whether two root resolutions of a class-wired graph carry the descriptor's exact shape and lifetimes.
 *
 * @remarks Walks both trees with one singleton registry, so a singleton that differs between the two
 * resolutions, or a dependency wired out of order, reads as a broken graph rather than a fast one.
 *
 * @since 0.8.0
 */
export function isRealisticClassGraphWellFormed(
  graph: GraphDescriptor,
  first: RealisticNode,
  second: RealisticNode,
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

  return first !== second && first.__id === graph.rootId && walk(first) && walk(second);
}
