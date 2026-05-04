import type { ContainerGraphJson } from "#/dependency-graph";

/**
 * @since 0.3.16-canary.0
 */
export interface CytoscapeNode {
  data: { id: string; label: string; kind: string; scope: string; fromParent: boolean };
}

/**
 * @since 0.3.16-canary.0
 */
export interface CytoscapeEdge {
  data: { id: string; source: string; target: string; label?: string };
}

/**
 * @since 0.3.16-canary.0
 */
export type CytoscapeElements = Array<CytoscapeNode | CytoscapeEdge>;

/**
 * @since 0.3.16-canary.0
 */
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
    const data: CytoscapeEdge["data"] = {
      id: `edge-${idx}`,
      source: edge.from,
      target: edge.to,
    };
    if (edge.label !== undefined) {
      data.label = edge.label;
    }
    elements.push({ data });
  });

  return elements;
}
