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

/** An edge from the right edge of its dependent to the left edge of its dependency. */
interface PlacedEdge {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
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
      edges.push({
        from: edge.from,
        to: edge.to,
        x1: from.x + NODE_WIDTH,
        y1: from.y + NODE_HEIGHT / 2,
        x2: to.x,
        y2: to.y + NODE_HEIGHT / 2,
      });
    }
  }

  return { nodes: [...placed.values()], edges, width, height };
}
