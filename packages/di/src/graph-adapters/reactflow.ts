import type { ContainerGraphJson } from "#/dependency-graph";

export interface ReactFlowNode {
  id: string;
  data: { label: string; kind: string; scope: string; fromParent: boolean };
  position: { x: number; y: number };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ReactFlowGraph {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

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

  const edges: ReactFlowEdge[] = graph.edges.map((edge, idx) => ({
    id: `edge-${idx}`,
    source: edge.from,
    target: edge.to,
    label: edge.label,
  }));

  return { nodes, edges };
}
