/**
 * iti adapter for the shared realistic-graph descriptor.
 *
 * Mirrors the other adapters' node identities and factory semantics. iti has no
 * transient scope — every `get` is memoized — so every node is a lazy singleton.
 * That is faithful for the cold-resolve row (each node is resolved once); the
 * hot transient-root and transient-chain rows have no honest iti equivalent and
 * are omitted from its scenarios.
 */
import { createContainer } from "iti";

import { assertGraphIsWellFormed, topologicallyOrderedNodeIds } from "#/fixtures/realistic-graph";
import type { GraphDescriptor, RealisticNode } from "#/fixtures/realistic-graph";

type ItiNodeFactory = () => RealisticNode;

/**
 * A built iti container exposed as a root resolver. iti keys are the node ids,
 * so scenarios only need to resolve the root; deps cascade through the memoized
 * context.
 */
export interface ItiRealisticBuild {
  readonly resolveRoot: () => RealisticNode;
}

/**
 * Builds a fresh iti container from the descriptor, wiring every node as a
 * memoized factory keyed by its id.
 */
export function buildItiRealisticContainer(graph: GraphDescriptor): ItiRealisticBuild {
  assertGraphIsWellFormed(graph);

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  // Assigned once the container exists; every node factory closes over it and
  // is only invoked at resolve time, after the assignment below.
  let resolveNode: (id: string) => RealisticNode = () => {
    throw new Error("iti adapter: resolver used before the container was built");
  };

  const graphFactories: Record<string, ItiNodeFactory> = {};
  for (const nodeId of topologicallyOrderedNodeIds(graph)) {
    const node = nodesById.get(nodeId);
    if (node === undefined) {
      throw new Error(`iti adapter: node missing for "${nodeId}"`);
    }
    graphFactories[nodeId] = (): RealisticNode => ({
      __id: nodeId,
      resolvedDependencies: node.dependencies.map((dependencyId) => resolveNode(dependencyId)),
    });
  }

  const container = createContainer().upsert(graphFactories);
  resolveNode = (id) => container.get(id);
  return { resolveRoot: () => container.get(graph.rootId) };
}

/**
 * Sanity helper: resolves the root and asserts the expected shape.
 */
export function sanityCheckItiRealisticResolve(graph: GraphDescriptor): boolean {
  const resolved = buildItiRealisticContainer(graph).resolveRoot();
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}
