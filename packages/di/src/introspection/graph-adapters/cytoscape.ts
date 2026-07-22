import type { ContainerGraphJson } from "#/introspection/dependency-graph";

/**
 * @since 0.3.16-canary.0
 */
export interface CytoscapeNode {
  readonly data: {
    readonly id: string;
    readonly label: string;
    readonly kind: string;
    readonly scope: string;
    readonly fromParent: boolean;
  };
}

/**
 * @since 0.3.16-canary.0
 */
export interface CytoscapeEdge {
  readonly data: {
    readonly id: string;
    readonly source: string;
    readonly target: string;
    readonly label?: string;
  };
}

/**
 * @since 0.3.16-canary.0
 */
export type CytoscapeElements = ReadonlyArray<CytoscapeNode | CytoscapeEdge>;

/**
 * @since 0.3.16-canary.0
 */
export function toCytoscapeGraph(graph: ContainerGraphJson): CytoscapeElements {
  const elements: Array<CytoscapeNode | CytoscapeEdge> = [];

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

  for (let idx = 0; idx < graph.edges.length; idx += 1) {
    const edge = graph.edges[idx]!;
    elements.push({
      data: {
        id: `edge-${idx}`,
        source: edge.from,
        target: edge.to,
        ...(edge.label !== undefined ? { label: edge.label } : {}),
      },
    });
  }

  return elements;
}
