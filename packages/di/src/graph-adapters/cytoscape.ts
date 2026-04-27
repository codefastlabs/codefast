import type { ContainerGraphJson } from "#/dependency-graph";

export interface CytoscapeNode {
  data: { id: string; label: string; kind: string; scope: string; fromParent: boolean };
}

export interface CytoscapeEdge {
  data: { id: string; source: string; target: string; label?: string };
}

export type CytoscapeElements = Array<CytoscapeNode | CytoscapeEdge>;

export function toCytoscapeGraph(graph: ContainerGraphJson): CytoscapeElements {
  const elements: CytoscapeElements = [];

  for (const node of graph.nodes) {
    elements.push({
      data: {
        id: node.id,
        label: node.tokenName,
        kind: node.kind,
        scope: node.scope,
        fromParent: node.fromParent,
      },
    });
  }

  graph.edges.forEach((edge, idx) => {
    elements.push({
      data: {
        id: `edge-${idx}`,
        source: edge.from,
        target: edge.to,
        label: edge.label,
      },
    });
  });

  return elements;
}
