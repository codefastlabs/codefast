import type { ContainerGraphJson } from "#/dependency-graph";

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowNode {
  id: string;
  data: { label: string; kind: string; scope: string; fromParent: boolean };
  position: { x: number; y: number };
}

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowGraph {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

/**
 * @since 0.3.16-canary.0
 */
export function toReactFlowGraph(graph: ContainerGraphJson): ReactFlowGraph {
  const nodes: ReactFlowNode[] = graph.nodes.map((node, idx) => ({
    id: node.id,
    data: {
      label: node.tokenName,
      kind: node.kind,
      scope: node.scope,
      fromParent: node.fromParent,
    },
    position: { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 100 },
  }));

  const edges: ReactFlowEdge[] = graph.edges.map((edge, idx) => {
    const reactFlowEdge: ReactFlowEdge = {
      id: `edge-${idx}`,
      source: edge.from,
      target: edge.to,
    };
    if (edge.label !== undefined) {
      reactFlowEdge.label = edge.label;
    }
    return reactFlowEdge;
  });

  return { nodes, edges };
}
