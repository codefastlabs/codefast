/**
 * @codefast/di — `generateDependencyGraph()`, the last public introspection entry with no row.
 *
 * `inspect-snapshot` and `lookup-bindings` read the registry; the graph walks it and derives edges
 * from every binding's declared dependencies, which is a different traversal and the one the graph
 * adapters are handed. A `toDynamic` factory is opaque — it contributes a node and no edges — so the
 * realistic fixture would price the walk over a graph that has none. This row binds injectable classes
 * whose declared dependencies are exactly what the edge walk reads, and its `sanity` pins the edge
 * count so a graph that stopped deriving edges cannot pass as a hit.
 */
import type { Constructor, Token } from "@codefast/di";
import { Container, injectable, token } from "@codefast/di";

import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const GRAPH_EXPORT_BATCH = 10;

interface GraphNode {
  readonly id: string;
}

/** One node: its id and the ids of the nodes it declares as constructor dependencies. */
interface NodeSpec {
  readonly id: string;
  readonly dependsOn: ReadonlyArray<string>;
}

// A back-end-shaped DAG: a shared logger, infra leaves, repositories on the infra, services on the
// repositories, and a controller composing them — 10 nodes, declared dependencies throughout.
const GRAPH_SPECS: ReadonlyArray<NodeSpec> = [
  { id: "logger", dependsOn: [] },
  { id: "config", dependsOn: [] },
  { id: "metrics", dependsOn: ["logger"] },
  { id: "cache", dependsOn: ["config"] },
  { id: "http", dependsOn: ["logger", "config"] },
  { id: "userRepo", dependsOn: ["http", "cache"] },
  { id: "orderRepo", dependsOn: ["http", "metrics"] },
  { id: "userService", dependsOn: ["userRepo", "logger"] },
  { id: "orderService", dependsOn: ["orderRepo", "cache"] },
  { id: "controller", dependsOn: ["userService", "orderService", "logger"] },
];

const DECLARED_EDGE_COUNT = GRAPH_SPECS.reduce((total, spec) => total + spec.dependsOn.length, 0);

/** Declares its dependencies for the edge walk; an @injectable class may declare more than it takes. */
function buildNodeClass(nodeId: string, depTokens: ReadonlyArray<Token<GraphNode>>): Constructor<GraphNode> {
  @injectable(depTokens)
  class GraphLevel implements GraphNode {
    readonly id = nodeId;
  }

  return GraphLevel;
}

function buildGraphContainer(): Container {
  const container = Container.create();
  const tokensById = new Map<string, Token<GraphNode>>(
    GRAPH_SPECS.map((spec) => [spec.id, token<GraphNode>(`bench-cf-graph-${spec.id}`)]),
  );

  for (const spec of GRAPH_SPECS) {
    const depTokens = spec.dependsOn.map((depId) => tokensById.get(depId)!);
    container.bind(tokensById.get(spec.id)!).to(buildNodeClass(spec.id, depTokens)).transient();
  }

  return container;
}

function buildGenerateDependencyGraphScenario(): BenchScenario {
  const container = buildGraphContainer();
  const prewarmed = container.generateDependencyGraph();

  return {
    id: "generate-dependency-graph",
    group: "introspection",
    what: `container.generateDependencyGraph() over a ${String(GRAPH_SPECS.length)}-node class graph → nodes and their declared-dependency edges (codefast-only)`,
    batch: GRAPH_EXPORT_BATCH,
    // Edges are the point: a node-only count would pass over a graph whose edge walk found nothing.
    sanity: () => {
      const graph = container.generateDependencyGraph();

      return (
        graph.nodes.length === GRAPH_SPECS.length &&
        graph.edges.length === DECLARED_EDGE_COUNT &&
        prewarmed.edges.length === DECLARED_EDGE_COUNT
      );
    },
    build: () =>
      batched(GRAPH_EXPORT_BATCH, () => {
        container.generateDependencyGraph();
      }),
  };
}

export function buildCodefastGraphExportScenarios(): ReadonlyArray<BenchScenario> {
  return [buildGenerateDependencyGraphScenario()];
}
