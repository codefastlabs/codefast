import type { ContainerGraphJson } from "#/inspector";
import type { StaticDependencyEdge } from "#/dependency-graph";
import type { CytoscapeEdge, CytoscapeGraphJson, CytoscapeNode } from "#/graph-adapters/types";
export function toCytoscapeGraph(graph: ContainerGraphJson): CytoscapeGraphJson {
  const nodes: CytoscapeNode[] = graph.nodes.map((node) => ({
    data: {
      id: node.bindingId,
      label: node.registryKeyLabel,
      bindingId: node.bindingId,
      kind: node.kind,
      scope: node.scope,
      activationStatus: node.activationStatus,
      hasConditionalConstraint: node.hasConditionalConstraint,
      ...(node.moduleId === undefined ? {} : { moduleId: node.moduleId }),
    },
  }));
  const edges: CytoscapeEdge[] = graph.edges.map((edge) => ({
    data: {
      id: edgeIdForCytoscape(edge),
      source: edge.fromBindingId,
      target: edge.toBindingId,
      edgeKind: edge.edgeKind,
      ...(edge.injectHintLabel === undefined ? {} : { injectHintLabel: edge.injectHintLabel }),
      isToBindingConditional: edge.isToBindingConditional,
      isAliasEdge: edge.isAliasEdge,
      resolutionPath: [...edge.resolutionPath],
    },
  }));
  return {
    elements: {
      nodes,
      edges,
    },
  };
}
function edgeIdForCytoscape(edge: StaticDependencyEdge): string {
  const hint = edge.injectHintLabel ?? "";
  const conditional = edge.isToBindingConditional ? "conditional" : "plain";
  const alias = edge.isAliasEdge ? "alias" : "direct";
  const path = edge.resolutionPath.join("->");
  return `${edge.fromBindingId}->${edge.toBindingId}:${edge.edgeKind}:${hint}:${conditional}:${alias}:${path}`;
}
