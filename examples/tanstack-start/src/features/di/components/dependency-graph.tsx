import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { useAppearance } from "@codefast/theme";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import type { Edge, Node, NodeProps } from "@xyflow/react";
import type { ReactElement } from "react";
import { memo, useEffect, useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";

type DependencyGraphProps = ReactFlowGraph;

interface DiNodeData extends Record<string, unknown> {
  readonly label: string;
  /** Named multi-binding slot (e.g. `non-empty`) when this node is one of several on a token. */
  readonly bindingName: string | undefined;
  readonly meta: string;
}

type DiNode = Node<DiNodeData, "di">;

const NODE_GAP_X = 280;
const LAYER_GAP_Y = 168;

/** Pull `name:*` slot labels off injectAll edges onto their target nodes. */
function bindingNamesByTarget(edges: ReactFlowGraph["edges"]): Map<string, string> {
  const names = new Map<string, string>();

  for (const edge of edges) {
    const match = /^name:(.+)$/.exec(edge.label ?? "");

    if (match?.[1] !== undefined) {
      names.set(edge.target, match[1]);
    }
  }

  return names;
}

/**
 * Edge labels kept on the wire: drop constructor indices (`[0]`) and named-slot
 * markers (`name:…`) once those names live on the target node.
 */
function edgeLabel(label: string | undefined): string | undefined {
  if (label === undefined || /^\[\d+\]$/.test(label) || label.startsWith("name:")) {
    return undefined;
  }

  return label;
}

/**
 * Layered layout: consumers above the tokens they depend on (matches DOT `rankdir=TB`
 * and the adapter's `source=from` / `target=to` direction). Wider gaps so multi-bound
 * siblings (TaskValidator ×3) fan out instead of stacking on one bus.
 */
function layoutPositions(
  nodes: ReactFlowGraph["nodes"],
  edges: ReactFlowGraph["edges"],
  bindingNames: Map<string, string>,
): Map<string, { x: number; y: number }> {
  const ids = new Set(nodes.map((node) => node.id));
  const outgoing = new Map<string, Array<string>>();

  for (const id of ids) {
    outgoing.set(id, []);
  }

  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)?.push(edge.target);
  }

  const rank = new Map<string, number>();

  const assignRank = (id: string, depth: number): void => {
    const current = rank.get(id) ?? -1;

    if (depth <= current) {
      return;
    }

    rank.set(id, depth);

    for (const target of outgoing.get(id) ?? []) {
      assignRank(target, depth + 1);
    }
  };

  const roots = [...ids].filter((id) => edges.every((edge) => edge.target !== id));

  for (const root of roots.length > 0 ? roots : ids) {
    assignRank(root, 0);
  }

  for (const id of ids) {
    if (!rank.has(id)) {
      assignRank(id, 0);
    }
  }

  const columns = new Map<number, Array<string>>();

  for (const id of ids) {
    const depth = rank.get(id) ?? 0;
    const column = columns.get(depth) ?? [];

    column.push(id);
    columns.set(depth, column);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const sortedRanks = [...columns.keys()].sort((a, b) => a - b);
  const labelOf = (id: string): string => nodes.find((node) => node.id === id)?.data.label ?? id;
  const sortKey = (id: string): string => `${labelOf(id)}\0${bindingNames.get(id) ?? ""}`;

  for (const depth of sortedRanks) {
    const column = columns.get(depth) ?? [];

    column.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

    const layerWidth = Math.max(0, column.length - 1) * NODE_GAP_X;

    column.forEach((id, index) => {
      positions.set(id, {
        x: index * NODE_GAP_X - layerWidth / 2,
        y: depth * LAYER_GAP_Y,
      });
    });
  }

  return positions;
}

const DiServiceNode = memo(function DiServiceNode({ data }: NodeProps<DiNode>): ReactElement {
  return (
    <div className="min-w-44 rounded-md border border-border bg-card px-3 py-2 text-center shadow-sm">
      <Handle className="!bg-muted-foreground" position={Position.Top} type="target" />
      <div className="text-xs font-medium text-foreground">{data.label}</div>
      {data.bindingName !== undefined ? (
        <div className="mt-0.5 font-mono text-[10px] text-foreground">{data.bindingName}</div>
      ) : null}
      <div className="mt-0.5 text-[10px] text-muted-foreground">{data.meta}</div>
      <Handle className="!bg-muted-foreground" position={Position.Bottom} type="source" />
    </div>
  );
});

const nodeTypes = { di: DiServiceNode };

function DependencyGraphCanvas({ nodes, edges }: DependencyGraphProps): ReactElement {
  const { colorScheme } = useAppearance();

  const bindingNames = useMemo(() => bindingNamesByTarget(edges), [edges]);
  const positions = useMemo(() => layoutPositions(nodes, edges, bindingNames), [nodes, edges, bindingNames]);

  const flowNodes: Array<DiNode> = useMemo(
    () =>
      nodes.map((node) => {
        const bindingName = bindingNames.get(node.id);

        return {
          id: node.id,
          type: "di",
          position: positions.get(node.id) ?? node.position,
          data: {
            label: node.data.label,
            bindingName,
            meta: `${node.data.scope} · ${node.data.kind}`,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };
      }),
    [nodes, positions, bindingNames],
  );

  const flowEdges: Array<Edge> = useMemo(
    () =>
      edges.map((edge) => {
        const label = edgeLabel(edge.label);

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "default",
          ...(label !== undefined ? { label } : {}),
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        };
      }),
    [edges],
  );

  return (
    <ReactFlow
      colorMode={colorScheme}
      defaultEdgeOptions={{ type: "default" }}
      edges={flowEdges}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.24 }}
      minZoom={0.35}
      nodes={flowNodes}
      nodesConnectable={false}
      nodesDraggable={false}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={16} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

/**
 * Interactive DI dependency graph (React Flow). Mount-gated so Nitro SSR never
 * touches browser-only layout APIs.
 */
export function DependencyGraph({ nodes, edges }: DependencyGraphProps): ReactElement {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden className="min-h-[28rem] rounded-md bg-muted" />;
  }

  return (
    <div className="h-[28rem] overflow-hidden rounded-md border border-border bg-background">
      <ReactFlowProvider>
        <DependencyGraphCanvas edges={edges} nodes={nodes} />
      </ReactFlowProvider>
    </div>
  );
}
