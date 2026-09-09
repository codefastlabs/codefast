/**
 * injection-js adapter for the shared realistic-graph descriptor.
 *
 * Mirrors the other adapters' node identities and factory semantics. Angular's
 * `ReflectiveInjector` caches every `get`, so graph nodes are singleton factory
 * providers. The transient root is expressed with `instantiateResolved`, which
 * builds a fresh instance without caching while its singleton deps stay cached —
 * the same work the other adapters do for a transient root over singleton deps.
 */
import "reflect-metadata";
import type { Provider, ResolvedReflectiveProvider } from "injection-js";
import { InjectionToken, ReflectiveInjector } from "injection-js";

import { assertGraphIsWellFormed, topologicallyOrderedNodeIds } from "#/fixtures/realistic-graph";
import type { GraphDescriptor, RealisticNode } from "#/fixtures/realistic-graph";

/**
 * A built injector plus the resolved root provider, retained so the hot row can
 * re-instantiate a fresh transient root against cached singleton dependencies.
 */
export interface InjectionJsRealisticBuild {
  readonly injector: ReflectiveInjector;
  readonly rootToken: InjectionToken<RealisticNode>;
  readonly resolvedRootProvider: ResolvedReflectiveProvider;
  readonly tokensById: ReadonlyMap<string, InjectionToken<RealisticNode>>;
}

function buildTokens(graph: GraphDescriptor): ReadonlyMap<string, InjectionToken<RealisticNode>> {
  const tokensById = new Map<string, InjectionToken<RealisticNode>>();
  for (const nodeId of topologicallyOrderedNodeIds(graph)) {
    tokensById.set(nodeId, new InjectionToken<RealisticNode>(`realistic:${nodeId}`));
  }
  return tokensById;
}

function providerForNode(
  nodeId: string,
  graph: GraphDescriptor,
  tokensById: ReadonlyMap<string, InjectionToken<RealisticNode>>,
): Provider {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) {
    throw new Error(`injection-js adapter: node missing for "${nodeId}"`);
  }
  const nodeToken = tokensById.get(nodeId);
  if (nodeToken === undefined) {
    throw new Error(`injection-js adapter: token missing for node "${nodeId}"`);
  }
  const dependencyTokens = node.dependencies.map((dependencyId) => {
    const dependencyToken = tokensById.get(dependencyId);
    if (dependencyToken === undefined) {
      throw new Error(`injection-js adapter: dependency token missing for "${nodeId}" -> "${dependencyId}"`);
    }
    return dependencyToken;
  });

  return {
    provide: nodeToken,
    useFactory: (...resolvedDependencies: Array<RealisticNode>): RealisticNode => ({
      __id: nodeId,
      resolvedDependencies,
    }),
    deps: dependencyTokens,
  };
}

/**
 * Builds a fresh injector from the descriptor plus the resolved root provider
 * used by the transient-root row.
 */
export function buildInjectionJsRealisticInjector(graph: GraphDescriptor): InjectionJsRealisticBuild {
  assertGraphIsWellFormed(graph);

  const tokensById = buildTokens(graph);
  const providers = topologicallyOrderedNodeIds(graph).map((nodeId) => providerForNode(nodeId, graph, tokensById));
  const injector = ReflectiveInjector.resolveAndCreate(providers);

  const rootToken = tokensById.get(graph.rootId);
  if (rootToken === undefined) {
    throw new Error(`injection-js adapter: root token missing for "${graph.rootId}"`);
  }
  const rootProvider = providerForNode(graph.rootId, graph, tokensById);
  const resolvedRootProvider = ReflectiveInjector.resolve([rootProvider])[0];
  if (resolvedRootProvider === undefined) {
    throw new Error(`injection-js adapter: root provider failed to resolve for "${graph.rootId}"`);
  }
  return { injector, rootToken, resolvedRootProvider, tokensById };
}

/**
 * Sanity helper for the cold-resolve row: builds a fresh injector and resolves
 * the root once.
 */
export function sanityCheckInjectionJsRealisticColdResolve(graph: GraphDescriptor): boolean {
  const { injector, rootToken } = buildInjectionJsRealisticInjector(graph);
  const resolved = injector.get(rootToken);
  return resolved.__id === graph.rootId && resolved.resolvedDependencies.length > 0;
}

/**
 * Sanity helper for the transient-root row: instantiates the root fresh and
 * asserts a distinct instance each call over shared singleton dependencies.
 */
export function sanityCheckInjectionJsRealisticTransientRoot(graph: GraphDescriptor): boolean {
  const { injector, resolvedRootProvider } = buildInjectionJsRealisticInjector(graph);
  const first = injector.instantiateResolved(resolvedRootProvider) as RealisticNode;
  const second = injector.instantiateResolved(resolvedRootProvider) as RealisticNode;
  return (
    first !== second &&
    first.__id === graph.rootId &&
    first.resolvedDependencies.length > 0 &&
    first.resolvedDependencies[0] === second.resolvedDependencies[0]
  );
}
