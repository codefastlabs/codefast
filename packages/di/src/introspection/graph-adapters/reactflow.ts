import type { ContainerGraphJson } from "#/introspection/dependency-graph";

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowNode {
  readonly id: string;
  readonly data: {
    readonly label: string;
    readonly kind: string;
    readonly scope: string;
    readonly fromParent: boolean;
  };
  readonly position: { readonly x: number; readonly y: number };
}

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowGraph {
  readonly nodes: ReadonlyArray<ReactFlowNode>;
  readonly edges: ReadonlyArray<ReactFlowEdge>;
}

/**
 * @since 0.3.16-canary.0
 */
export function toReactFlowGraph(graph: ContainerGraphJson): ReactFlowGraph {
  const nodes: Array<ReactFlowNode> = graph.nodes.map((node, idx) => ({
    id: node.id,
    data: {
      label: node.tokenName,
      kind: node.kind,
      scope: node.scope,
      fromParent: node.fromParent,
    },
    position: { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 100 },
  }));

  const edges: Array<ReactFlowEdge> = graph.edges.map((edge, idx) => ({
    id: `edge-${idx}`,
    source: edge.from,
    target: edge.to,
    ...(edge.label !== undefined ? { label: edge.label } : {}),
  }));

  return { nodes, edges };
}
