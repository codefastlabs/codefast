/**
 * InversifyJS 8 adapter for the shared realistic-graph descriptor.
 *
 * Mirrors {@link ../fixtures/codefast-adapter.ts}: same node identities,
 * same factory semantics via `toDynamicValue`, same scope mapping. The
 * two adapters are the only library-coupled files in the fixture set —
 * everything downstream (scenarios, harness) stays library-agnostic.
 */
import "reflect-metadata";
import type { Container as InversifyContainerType, ServiceIdentifier } from "inversify";
import { Container } from "inversify";
import {
  assertGraphIsWellFormed,
  type GraphDescriptor,
  type NodeDescriptor,
  type RealisticNode,
  topologicallyOrderedNodeIds,
} from "./realistic-graph";

/**
 * A built container plus every service identifier, retained so sanity
 * checks can resolve any node. Scenarios typically only need
 * `rootIdentifier` + `container`.
 */
export interface InversifyRealisticBuild {
  readonly container: InversifyContainerType;
  readonly rootIdentifier: ServiceIdentifier<RealisticNode>;
  readonly identifiersById: ReadonlyMap<string, ServiceIdentifier<RealisticNode>>;
}

function bindOneNode(
  container: InversifyContainerType,
  node: NodeDescriptor,
  identifiersById: ReadonlyMap<string, ServiceIdentifier<RealisticNode>>,
): void {
  const nodeIdentifier = identifiersById.get(node.id);
  if (nodeIdentifier === undefined) {
    throw new Error(`Inversify adapter: identifier missing for node "${node.id}"`);
  }
  const dependencyIdentifiers = node.dependencies.map((dependencyId) => {
    const dependencyIdentifier = identifiersById.get(dependencyId);
    if (dependencyIdentifier === undefined) {
      throw new Error(
        `Inversify adapter: dependency identifier missing for "${node.id}" -> "${dependencyId}"`,
      );
    }
    return dependencyIdentifier;
  });

  const binding = container
    .bind<RealisticNode>(nodeIdentifier)
    .toDynamicValue((resolutionContext): RealisticNode => {
      const resolvedDependencies: RealisticNode[] = [];
      for (const dependencyIdentifier of dependencyIdentifiers) {
        resolvedDependencies.push(resolutionContext.get<RealisticNode>(dependencyIdentifier));
      }
      return {
        __id: node.id,
        resolvedDependencies,
      };
    });

  if (node.lifetime === "singleton") {
    binding.inSingletonScope();
  } else {
    binding.inTransientScope();
  }
}

/**
 * Builds a fresh inversify container from the descriptor. Use
 * per-iteration for `realistic-graph-cold-resolve`, or once in scenario
 * setup for hot-path scenarios.
 */
export function buildInversifyRealisticContainer(graph: GraphDescriptor): InversifyRealisticBuild {
  assertGraphIsWellFormed(graph);

  const container = new Container();
  const identifiersById = new Map<string, ServiceIdentifier<RealisticNode>>();
  for (const nodeId of topologicallyOrderedNodeIds(graph)) {
    // `Symbol()` (not `Symbol.for`) keeps the inversify identifier unique
    // even if something else in the process coincidentally uses the same
    // label. Matters when tests run alongside the bench subprocess.
    identifiersById.set(nodeId, Symbol(`realistic:${nodeId}`));
  }
  for (const node of graph.nodes) {
    bindOneNode(container, node, identifiersById);
  }
  const rootIdentifier = identifiersById.get(graph.rootId);
  if (rootIdentifier === undefined) {
    throw new Error(`Inversify adapter: root identifier missing for "${graph.rootId}"`);
  }
  return { container, rootIdentifier, identifiersById };
}

/**
 * Sanity helper: resolves the root and asserts the expected shape.
 */
export function sanityCheckInversifyRealisticResolve(graph: GraphDescriptor): boolean {
  const { container, rootIdentifier } = buildInversifyRealisticContainer(graph);
  const resolved = container.get<RealisticNode>(rootIdentifier);
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}
