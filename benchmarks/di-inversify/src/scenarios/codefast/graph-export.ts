/**
 * @codefast/di — `generateDependencyGraph()`, the last public introspection entry with no row.
 *
 * `inspect-snapshot` and `lookup-bindings` read the registry; the graph walks it and derives edges
 * from every binding's declared dependencies, which is a different traversal and the one the graph
 * adapters are handed. Measured over the same 10-node graph `realistic-graph-validate` uses, so the
 * two introspection costs are comparable.
 */
import { buildCodefastRealisticContainer } from "#/fixtures/codefast-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const GRAPH_EXPORT_BATCH = 10;

function buildGenerateDependencyGraphScenario(): BenchScenario {
  const { container } = buildCodefastRealisticContainer(REALISTIC_GRAPH);
  const prewarmed = container.generateDependencyGraph();

  return {
    id: "generate-dependency-graph",
    group: "introspection",
    what: "container.generateDependencyGraph() over a 10-node graph → nodes and edges (codefast-only)",
    batch: GRAPH_EXPORT_BATCH,
    sanity: () =>
      prewarmed.nodes.length > 0 && container.generateDependencyGraph().nodes.length === prewarmed.nodes.length,
    build: () =>
      batched(GRAPH_EXPORT_BATCH, () => {
        container.generateDependencyGraph();
      }),
  };
}

export function buildCodefastGraphExportScenarios(): ReadonlyArray<BenchScenario> {
  return [buildGenerateDependencyGraphScenario()];
}
