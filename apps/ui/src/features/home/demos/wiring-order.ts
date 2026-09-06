/** Pure helpers that turn a container's dependency graph into a construction order and a layered layout. */
import type { ContainerGraphJson, GraphNode } from "@codefast/di";

/** The construction order for `rootId`: every dependency before what depends on it, each node once. */
export function constructionOrder(graph: ContainerGraphJson, rootId: string): Array<string> {
  const dependenciesOf = new Map<string, Array<string>>();

  for (const edge of graph.edges) {
    const dependencies = dependenciesOf.get(edge.from);

    if (dependencies) {
      dependencies.push(edge.to);
    } else {
      dependenciesOf.set(edge.from, [edge.to]);
    }
  }

  const order: Array<string> = [];
  const seen = new Set<string>();
  const visit = (id: string): void => {
    if (seen.has(id)) {
      return;
    }

    seen.add(id);

    for (const dependency of dependenciesOf.get(id) ?? []) {
      visit(dependency);
    }

    order.push(id);
  };

  visit(rootId);

  return order;
}

/** The column of every node: nothing depends on column 0, and a dependency sits one past its deepest dependent. */
export function nodeColumns(graph: ContainerGraphJson): Map<string, number> {
  const dependentsOf = new Map<string, Array<string>>();

  for (const edge of graph.edges) {
    const dependents = dependentsOf.get(edge.to);

    if (dependents) {
      dependents.push(edge.from);
    } else {
      dependentsOf.set(edge.to, [edge.from]);
    }
  }

  const columns = new Map<string, number>();
  const visiting = new Set<string>();
  const columnOf = (id: string): number => {
    const known = columns.get(id);

    if (known !== undefined) {
      return known;
    }

    // A cycle cannot be laid out; the container refuses one anyway, so the node just stays in its first column.
    if (visiting.has(id)) {
      return 0;
    }

    visiting.add(id);

    const dependents = dependentsOf.get(id) ?? [];
    const column = dependents.length === 0 ? 0 : 1 + Math.max(...dependents.map(columnOf));

    visiting.delete(id);
    columns.set(id, column);

    return column;
  };

  for (const node of graph.nodes) {
    columnOf(node.id);
  }

  return columns;
}

/** A node with its top-left corner in layout coordinates. */
interface PlacedNode {
  readonly node: GraphNode;
  readonly x: number;
  readonly y: number;
}

/** A point an edge passes through on its way across a column it does not stop in. */
export interface Waypoint {
  readonly x: number;
  readonly y: number;
}

/**
 * An edge from the right edge of its dependent to the left edge of its dependency. Across every column in between it
 * runs level through a gap between that column's nodes, so a node never sits on top of it.
 */
export interface PlacedEdge {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly waypoints: ReadonlyArray<Waypoint>;
}

/** The whole picture: placed nodes and edges plus the canvas they need. */
export interface GraphLayout {
  readonly nodes: ReadonlyArray<PlacedNode>;
  readonly edges: ReadonlyArray<PlacedEdge>;
  readonly width: number;
  readonly height: number;
}

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 52;
const COLUMN_GAP = 72;
const ROW_GAP = 20;

/** Lays the graph out in columns, dependents on the left, each column centred on the tallest one. */
export function layoutGraph(graph: ContainerGraphJson): GraphLayout {
  const columns = nodeColumns(graph);
  const byColumn = new Map<number, Array<GraphNode>>();

  for (const node of graph.nodes) {
    const column = columns.get(node.id) ?? 0;
    const members = byColumn.get(column);

    if (members) {
      members.push(node);
    } else {
      byColumn.set(column, [node]);
    }
  }

  const columnCount = byColumn.size === 0 ? 0 : Math.max(...byColumn.keys()) + 1;
  const tallest = Math.max(0, ...[...byColumn.values()].map((members) => members.length));
  const height = tallest * NODE_HEIGHT + Math.max(0, tallest - 1) * ROW_GAP;
  const width = columnCount * NODE_WIDTH + Math.max(0, columnCount - 1) * COLUMN_GAP;
  const placed = new Map<string, PlacedNode>();

  for (const [column, members] of byColumn) {
    const sorted = [...members].toSorted((a, b) => a.tokenName.localeCompare(b.tokenName));
    const columnHeight = sorted.length * NODE_HEIGHT + (sorted.length - 1) * ROW_GAP;
    const top = (height - columnHeight) / 2;

    for (const [row, node] of sorted.entries()) {
      placed.set(node.id, {
        node,
        x: column * (NODE_WIDTH + COLUMN_GAP),
        y: top + row * (NODE_HEIGHT + ROW_GAP),
      });
    }
  }

  const edges: Array<PlacedEdge> = [];

  for (const edge of graph.edges) {
    const from = placed.get(edge.from);
    const to = placed.get(edge.to);

    if (from && to) {
      const x1 = from.x + NODE_WIDTH;
      const y1 = from.y + NODE_HEIGHT / 2;
      const x2 = to.x;
      const y2 = to.y + NODE_HEIGHT / 2;
      const waypoints: Array<Waypoint> = [];

      for (let column = (columns.get(edge.from) ?? 0) + 1; column < (columns.get(edge.to) ?? 0); column += 1) {
        const left = column * (NODE_WIDTH + COLUMN_GAP);
        const rows = (byColumn.get(column) ?? []).map((node) => placed.get(node.id)?.y ?? 0).toSorted((a, b) => a - b);
        const straight = y1 + ((y2 - y1) * (left + NODE_WIDTH / 2 - x1)) / (x2 - x1);
        const y = gapNearest(rows, straight);

        waypoints.push({ x: left, y }, { x: left + NODE_WIDTH, y });
      }

      edges.push({ from: edge.from, to: edge.to, x1, y1, x2, y2, waypoints });
    }
  }

  return { nodes: [...placed.values()], edges, width, height };
}

/** The centre of the gap between a column's nodes nearest to `y`; above or below the column when it has one node. */
function gapNearest(rows: ReadonlyArray<number>, y: number): number {
  const gaps: Array<number> = [];

  for (const [index, top] of rows.entries()) {
    const next = rows[index + 1];

    if (next !== undefined) {
      gaps.push((top + NODE_HEIGHT + next) / 2);
    }
  }

  const first = rows[0];
  const last = rows.at(-1);

  if (gaps.length === 0 && first !== undefined && last !== undefined) {
    gaps.push(first - ROW_GAP / 2, last + NODE_HEIGHT + ROW_GAP / 2);
  }

  return gaps.reduce((best, gap) => (Math.abs(gap - y) < Math.abs(best - y) ? gap : best), gaps[0] ?? y);
}

// How far past each end an edge keeps level before it bends, so every bend happens inside a column gap.
const BEND = 36;

/** The SVG path of an edge: level through every waypoint, bending only between columns, ending just short of the box. */
export function edgePath(edge: PlacedEdge): string {
  const points: ReadonlyArray<Waypoint> = [
    { x: edge.x1, y: edge.y1 },
    ...edge.waypoints,
    { x: edge.x2 - 1, y: edge.y2 },
  ];
  let path = `M${edge.x1} ${edge.y1}`;

  for (const [index, point] of points.entries()) {
    const previous = points[index - 1];

    if (previous !== undefined) {
      const bend = Math.min(BEND, (point.x - previous.x) / 2);

      path += ` C ${previous.x + bend} ${previous.y}, ${point.x - bend} ${point.y}, ${point.x} ${point.y}`;
    }
  }

  return path;
}
