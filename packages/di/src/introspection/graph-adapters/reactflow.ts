import type { ContainerGraphJson, GraphNode } from "#/introspection/dependency-graph";

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowNode {
  readonly id: string;
  readonly data: {
    readonly label: string;
    readonly tokenKey: string;
    readonly kind: GraphNode["kind"];
    readonly scope: GraphNode["scope"];
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
  readonly optional: boolean;
  readonly slotName?: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ReactFlowGraph {
  readonly nodes: ReadonlyArray<ReactFlowNode>;
  readonly edges: ReadonlyArray<ReactFlowEdge>;
}

/**
 * Initial grid layout: React Flow expects concrete positions; viewers re-layout anyway.
 *
 * @since 0.3.16-canary.0
 */
const GRID_COLUMN_COUNT = 5;
const GRID_CELL_WIDTH_PX = 200;
const GRID_CELL_HEIGHT_PX = 100;

/**
 * @since 0.5.0-canary.7
 */
export function toReactFlowGraph(graph: ContainerGraphJson): ReactFlowGraph {
  const nodes: Array<ReactFlowNode> = graph.nodes.map((node, idx) => ({
    id: node.id,
    data: {
      label: node.tokenName,
      tokenKey: node.tokenKey,
      kind: node.kind,
      scope: node.scope,
      fromParent: node.fromParent,
    },
    position: {
      x: (idx % GRID_COLUMN_COUNT) * GRID_CELL_WIDTH_PX,
      y: Math.floor(idx / GRID_COLUMN_COUNT) * GRID_CELL_HEIGHT_PX,
    },
  }));

  const edges: Array<ReactFlowEdge> = graph.edges.map((edge, idx) => ({
    id: `edge-${idx}`,
    source: edge.from,
    target: edge.to,
    ...(edge.label !== undefined ? { label: edge.label } : {}),
    optional: edge.optional,
    ...(edge.slotName !== undefined ? { slotName: edge.slotName } : {}),
  }));

  return { nodes, edges };
}
