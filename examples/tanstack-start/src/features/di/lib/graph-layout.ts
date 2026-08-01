import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";

type GraphNodes = ReactFlowGraph["nodes"];
type GraphEdges = ReactFlowGraph["edges"];

const NODE_WIDTH_PX = 176;
const NODE_HEIGHT_PX = 64;
const NODE_GAP_X_PX = 236;
const ROW_GAP_Y_PX = 148;
const LANE_GAP_Y_PX = 64;
const LANE_PADDING_PX = 28;

export interface Lane {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PreparedGraph {
  readonly nodes: GraphNodes;
  readonly edges: GraphEdges;
  /** Child bindings that hide a root binding of the same token. */
  readonly shadowingIds: ReadonlySet<string>;
}

export interface GraphLayout {
  readonly positions: ReadonlyMap<string, { readonly x: number; readonly y: number }>;
  readonly lanes: ReadonlyArray<Lane>;
}

/** The named slot each node was bound under, read off the edges that resolve to it. */
export function slotNamesByNode(edges: GraphEdges): ReadonlyMap<string, string> {
  const names = new Map<string, string>();

  for (const edge of edges) {
    if (edge.slotName !== undefined) {
      names.set(edge.target, edge.slotName);
    }
  }

  return names;
}

/**
 * Shadowing is a token-identity question, so it is answered with `tokenKey` — two bindings that
 * merely share a display name are not the same token.
 */
export function prepareGraph(graph: ReactFlowGraph, showShadowed: boolean): PreparedGraph {
  const ownTokens = new Set(graph.nodes.filter((node) => !node.data.fromParent).map((node) => node.data.tokenKey));
  const shadowedIds = new Set(
    graph.nodes.filter((node) => node.data.fromParent && ownTokens.has(node.data.tokenKey)).map((node) => node.id),
  );
  const shadowedTokens = new Set(
    graph.nodes.filter((node) => shadowedIds.has(node.id)).map((node) => node.data.tokenKey),
  );
  const shadowingIds = new Set(
    graph.nodes
      .filter((node) => !node.data.fromParent && shadowedTokens.has(node.data.tokenKey))
      .map((node) => node.id),
  );

  if (showShadowed) {
    return { nodes: graph.nodes, edges: graph.edges, shadowingIds };
  }

  const nodes = graph.nodes.filter((node) => !shadowedIds.has(node.id));
  const visible = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target));

  return { nodes, edges, shadowingIds };
}

/**
 * Two lifetime swimlanes: the request child's own bindings on top, the root chain below.
 * Rows inside the root lane follow dependency depth among root nodes only.
 */
export function layoutLanes(nodes: GraphNodes, edges: GraphEdges, slotNames: ReadonlyMap<string, string>): GraphLayout {
  const isRequestNode = (node: GraphNodes[number]): boolean => !node.data.fromParent && node.data.kind !== "unbound";
  const requestNodes = nodes.filter((node) => isRequestNode(node));
  const rootNodes = nodes.filter((node) => !isRequestNode(node));

  // Longest-path rank inside the root lane; request-lane edges do not affect root rows.
  const rootIds = new Set(rootNodes.map((node) => node.id));
  const outgoing = new Map<string, Array<string>>();

  for (const edge of edges) {
    if (rootIds.has(edge.source) && rootIds.has(edge.target)) {
      outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    }
  }

  const rank = new Map<string, number>();
  const assignRank = (id: string, depth: number): void => {
    if (depth <= (rank.get(id) ?? -1)) {
      return;
    }

    rank.set(id, depth);

    for (const target of outgoing.get(id) ?? []) {
      assignRank(target, depth + 1);
    }
  };

  for (const node of rootNodes) {
    assignRank(node.id, 0);
  }

  const requestRow = requestNodes.map((node) => node.id);
  const rows: Array<Array<string>> = [requestRow];
  const rootRowCount = Math.max(0, ...[...rank.values()].map((depth) => depth + 1));

  for (let depth = 0; depth < rootRowCount; depth += 1) {
    rows.push(rootNodes.filter((node) => rank.get(node.id) === depth).map((node) => node.id));
  }

  const labelOf = (id: string): string => nodes.find((node) => node.id === id)?.data.label ?? id;
  const sortKey = (id: string): string => `${labelOf(id)}\0${slotNames.get(id) ?? ""}`;
  const positions = new Map<string, { x: number; y: number }>();

  rows.forEach((row, rowIndex) => {
    row.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const rowWidth = Math.max(0, row.length - 1) * NODE_GAP_X_PX;
    const laneOffset = rowIndex === 0 ? 0 : LANE_GAP_Y_PX;

    row.forEach((id, index) => {
      positions.set(id, { x: index * NODE_GAP_X_PX - rowWidth / 2, y: rowIndex * ROW_GAP_Y_PX + laneOffset });
    });
  });

  const bounds = (ids: ReadonlyArray<string>): { x: number; y: number; width: number; height: number } => {
    const points = ids.map((id) => positions.get(id)).filter((point) => point !== undefined);
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));

    return {
      x: minX - LANE_PADDING_PX,
      y: minY - LANE_PADDING_PX,
      width: maxX - minX + NODE_WIDTH_PX + LANE_PADDING_PX * 2,
      height: maxY - minY + NODE_HEIGHT_PX + LANE_PADDING_PX * 2,
    };
  };

  const lanes: Array<Lane> = [];

  if (requestRow.length > 0) {
    lanes.push({ id: "lane-request", label: "per-request (child container)", ...bounds(requestRow) });
  }

  if (rootNodes.length > 0) {
    lanes.push({ id: "lane-root", label: "root container", ...bounds(rootNodes.map((node) => node.id)) });
  }

  return { positions, lanes };
}
