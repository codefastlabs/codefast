import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { useAppearance } from "@codefast/theme";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import type { Edge, Node, NodeProps } from "@xyflow/react";
import type { ReactElement } from "react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import "@xyflow/react/dist/style.css";

interface DependencyGraphProps extends ReactFlowGraph {
  /** Include root bindings that a child binding shadows (hidden by default as visual noise). */
  showShadowed: boolean;
}

// Scope is the one fact this demo teaches, so it carries the color channel. The three hues are
// the first categorical slots of a palette validated all-pairs for CVD + contrast in both modes;
// the scope word always sits next to the dot, so identity never rides on color alone.
export const SCOPE_COLORS: Record<string, { light: string; dark: string }> = {
  singleton: { light: "#2a78d6", dark: "#3987e5" },
  scoped: { light: "#eb6834", dark: "#d95926" },
  transient: { light: "#1baf7a", dark: "#199e70" },
};

const HOVER_RELEASE_MS = 140;
const NODE_WIDTH = 176;
const NODE_GAP_X = 236;
const ROW_GAP_Y = 148;
const LANE_GAP_Y = 64;
const LANE_PADDING = 28;

interface DiNodeData extends Record<string, unknown> {
  readonly label: string;
  /** Named multi-binding slot (e.g. `non-empty`) when this node is one of several on a token. */
  readonly bindingName: string | undefined;
  readonly scope: string;
  readonly kind: string;
  readonly scopeColor: string | undefined;
  readonly fromParent: boolean;
  readonly unbound: boolean;
  readonly shadowsRoot: boolean;
  readonly dimmed: boolean;
  readonly selected: boolean;
}

interface LaneNodeData extends Record<string, unknown> {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

type DiNode = Node<DiNodeData, "di">;
type LaneNode = Node<LaneNodeData, "lane">;

/** Pull `name:*` slot labels off injectAll edges onto their target nodes. */
function bindingNamesByTarget(edges: ReactFlowGraph["edges"]): Map<string, string> {
  const names = new Map<string, string>();

  for (const edge of edges) {
    const match = /^name:(\S+)/.exec(edge.label ?? "");

    if (match?.[1] !== undefined) {
      names.set(edge.target, match[1]);
    }
  }

  return names;
}

interface PreparedGraph {
  readonly nodes: ReactFlowGraph["nodes"];
  readonly edges: ReactFlowGraph["edges"];
  readonly shadowedIds: ReadonlySet<string>;
  readonly shadowingIds: ReadonlySet<string>;
}

/** A root binding is shadowed when a child binding exists for the same token name. */
function prepareGraph(graph: ReactFlowGraph, showShadowed: boolean): PreparedGraph {
  const childLabels = new Set(graph.nodes.filter((node) => !node.data.fromParent).map((node) => node.data.label));
  const shadowedIds = new Set(
    graph.nodes.filter((node) => node.data.fromParent && childLabels.has(node.data.label)).map((node) => node.id),
  );
  const shadowedLabels = new Set(graph.nodes.filter((node) => shadowedIds.has(node.id)).map((node) => node.data.label));
  const shadowingIds = new Set(
    graph.nodes.filter((node) => !node.data.fromParent && shadowedLabels.has(node.data.label)).map((node) => node.id),
  );

  if (showShadowed) {
    return { nodes: graph.nodes, edges: graph.edges, shadowedIds, shadowingIds };
  }

  const nodes = graph.nodes.filter((node) => !shadowedIds.has(node.id));
  const visible = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target));

  return { nodes, edges, shadowedIds, shadowingIds };
}

/**
 * Two lifetime swimlanes: the request child's own bindings on top, the root chain below.
 * Rows inside the root lane follow dependency depth among root nodes only.
 */
function layoutLanes(
  nodes: ReactFlowGraph["nodes"],
  edges: ReactFlowGraph["edges"],
  bindingNames: Map<string, string>,
): {
  positions: Map<string, { x: number; y: number }>;
  lanes: Array<{ id: string; label: string; x: number; y: number; width: number; height: number }>;
} {
  const isRequestNode = (node: ReactFlowGraph["nodes"][number]): boolean =>
    !node.data.fromParent && node.data.kind !== "unbound";
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

  const rows: Array<Array<string>> = [requestNodes.map((node) => node.id)];
  const rootRowCount = Math.max(0, ...[...rank.values()].map((depth) => depth + 1));

  for (let depth = 0; depth < rootRowCount; depth += 1) {
    rows.push(rootNodes.filter((node) => rank.get(node.id) === depth).map((node) => node.id));
  }

  const labelOf = (id: string): string => nodes.find((node) => node.id === id)?.data.label ?? id;
  const sortKey = (id: string): string => `${labelOf(id)}\0${bindingNames.get(id) ?? ""}`;
  const positions = new Map<string, { x: number; y: number }>();

  rows.forEach((row, rowIndex) => {
    row.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const rowWidth = Math.max(0, row.length - 1) * NODE_GAP_X;
    const laneOffset = rowIndex === 0 ? 0 : LANE_GAP_Y;

    row.forEach((id, index) => {
      positions.set(id, { x: index * NODE_GAP_X - rowWidth / 2, y: rowIndex * ROW_GAP_Y + laneOffset });
    });
  });

  const bounds = (ids: Array<string>): { x: number; y: number; width: number; height: number } => {
    const points = ids.map((id) => positions.get(id)).filter((point) => point !== undefined);
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));

    return {
      x: minX - LANE_PADDING,
      y: minY - LANE_PADDING,
      width: maxX - minX + NODE_WIDTH + LANE_PADDING * 2,
      height: maxY - minY + 64 + LANE_PADDING * 2,
    };
  };

  const lanes: Array<{ id: string; label: string; x: number; y: number; width: number; height: number }> = [];

  if (requestNodes.length > 0) {
    lanes.push({ id: "lane-request", label: "per-request (child container)", ...bounds(rows[0]!) });
  }

  if (rootNodes.length > 0) {
    lanes.push({ id: "lane-root", label: "root container", ...bounds(rootNodes.map((node) => node.id)) });
  }

  return { positions, lanes };
}

const DiServiceNode = memo(function DiServiceNode({ data }: NodeProps<DiNode>): ReactElement {
  return (
    <div
      className={[
        "w-44 rounded-md border px-3 py-2 text-center transition-opacity",
        data.unbound
          ? "border-dashed bg-card/50"
          : data.fromParent
            ? "border-dashed bg-card shadow-sm"
            : "bg-card shadow-sm",
        data.selected ? "border-ring ring-2 ring-ring/40" : "border-border",
        data.dimmed ? "opacity-20" : data.unbound ? "opacity-70" : "",
      ].join(" ")}
      title={data.unbound ? "optional dependency with no binding" : `${data.kind} binding`}
    >
      <Handle className="!bg-muted-foreground" position={Position.Top} type="target" />
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground">
        <span>{data.label}</span>
        {data.shadowsRoot ? (
          <span className="rounded-sm bg-muted px-1 py-px text-[9px] font-normal text-muted-foreground">
            overrides root
          </span>
        ) : null}
      </div>
      {data.bindingName !== undefined ? (
        <div className="mt-0.5 font-mono text-[10px] text-foreground">{data.bindingName}</div>
      ) : null}
      <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        {data.scopeColor !== undefined ? (
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: data.scopeColor }} />
        ) : null}
        <span>{data.unbound ? "optional · not bound" : data.scope}</span>
      </div>
      <Handle className="!bg-muted-foreground" position={Position.Bottom} type="source" />
    </div>
  );
});

const SwimlaneNode = memo(function SwimlaneNode({ data }: NodeProps<LaneNode>): ReactElement {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40" style={{ width: data.width, height: data.height }}>
      <span className="absolute top-2 left-3 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {data.label}
      </span>
    </div>
  );
});

const nodeTypes = { di: DiServiceNode, lane: SwimlaneNode };

interface NodeDetails {
  readonly label: string;
  readonly scope: string;
  readonly kind: string;
  readonly lane: string;
  readonly dependsOn: Array<{ label: string; note: string | undefined }>;
  readonly usedBy: Array<string>;
}

function DependencyGraphCanvas({ nodes, edges, showShadowed }: DependencyGraphProps): ReactElement {
  const { colorScheme } = useAppearance();
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  // Leaving a node latches the spotlight briefly: crossing the gap between two nodes would
  // otherwise clear and re-apply it on every pass, which reads as flicker.
  const unhoverTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(unhoverTimerRef.current);
    };
  }, []);

  const hoverNode = (id: string): void => {
    clearTimeout(unhoverTimerRef.current);
    setHoveredId((current) => (current === id ? current : id));
  };

  const releaseHover = (): void => {
    clearTimeout(unhoverTimerRef.current);
    unhoverTimerRef.current = setTimeout(() => {
      setHoveredId(undefined);
    }, HOVER_RELEASE_MS);
  };

  const prepared = useMemo(() => prepareGraph({ nodes, edges }, showShadowed), [nodes, edges, showShadowed]);
  const bindingNames = useMemo(() => bindingNamesByTarget(prepared.edges), [prepared.edges]);
  const { positions, lanes } = useMemo(
    () => layoutLanes(prepared.nodes, prepared.edges, bindingNames),
    [prepared.nodes, prepared.edges, bindingNames],
  );

  // Hovering a node spotlights everything it (transitively) depends on.
  const highlighted = useMemo(() => {
    if (hoveredId === undefined) {
      return undefined;
    }

    const adjacency = new Map<string, Array<string>>();

    for (const edge of prepared.edges) {
      adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
    }

    const reachable = new Set<string>([hoveredId]);
    const queue = [hoveredId];

    while (queue.length > 0) {
      for (const next of adjacency.get(queue.pop()!) ?? []) {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      }
    }

    return reachable;
  }, [hoveredId, prepared.edges]);

  const laneNodes: Array<LaneNode> = useMemo(
    () =>
      lanes.map((lane) => ({
        id: lane.id,
        type: "lane",
        position: { x: lane.x, y: lane.y },
        data: { label: lane.label, width: lane.width, height: lane.height },
        draggable: false,
        selectable: false,
        // A lane is a backdrop: letting it take the pointer would fire leave/enter on every
        // crossing between two nodes.
        style: { pointerEvents: "none" },
        zIndex: -1,
      })),
    [lanes],
  );

  // Everything a node shows that hover/selection cannot change, built once per graph.
  const baseNodes: Array<DiNode> = useMemo(
    () =>
      prepared.nodes.map((node) => ({
        id: node.id,
        type: "di",
        position: positions.get(node.id) ?? node.position,
        data: {
          label: node.data.label,
          bindingName: bindingNames.get(node.id),
          scope: node.data.scope,
          kind: node.data.kind,
          scopeColor: SCOPE_COLORS[node.data.scope]?.[colorScheme === "dark" ? "dark" : "light"],
          fromParent: node.data.fromParent,
          unbound: node.data.kind === "unbound",
          shadowsRoot: prepared.shadowingIds.has(node.id),
          dimmed: false,
          selected: false,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })),
    [prepared, positions, bindingNames, colorScheme],
  );

  // React Flow re-renders a node when its `data` identity changes, so nodes whose dimmed/selected
  // flags did not move keep the exact object they already had. The cache is tied to `baseNodes`:
  // a new base (layout, theme, graph) invalidates every entry.
  const nodeCacheRef = useRef<{ base: Array<DiNode>; byId: Map<string, DiNode> }>({
    base: [],
    byId: new Map(),
  });

  const flowNodes: Array<DiNode | LaneNode> = useMemo(() => {
    if (nodeCacheRef.current.base !== baseNodes) {
      nodeCacheRef.current = { base: baseNodes, byId: new Map() };
    }

    const cache = nodeCacheRef.current.byId;
    const diNodes = baseNodes.map((node) => {
      const dimmed = highlighted !== undefined && !highlighted.has(node.id);
      const selected = node.id === selectedId;
      const cached = cache.get(node.id);

      if (cached !== undefined && cached.data.dimmed === dimmed && cached.data.selected === selected) {
        return cached;
      }

      const next: DiNode = { ...node, data: { ...node.data, dimmed, selected } };

      cache.set(node.id, next);

      return next;
    });

    return [...laneNodes, ...diNodes];
  }, [baseNodes, laneNodes, highlighted, selectedId]);

  const flowEdges: Array<Edge> = useMemo(
    () =>
      prepared.edges.map((edge) => {
        const optional = /\boptional\b/.test(edge.label ?? "");
        const onPath = highlighted === undefined || (highlighted.has(edge.source) && highlighted.has(edge.target));

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "default",
          animated: false,
          style: {
            ...(optional ? { strokeDasharray: "6 4" } : {}),
            opacity: onPath ? 1 : 0.12,
            strokeWidth: highlighted !== undefined && onPath ? 2 : 1.5,
            transition: "opacity 140ms ease, stroke-width 140ms ease",
          },
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        };
      }),
    [prepared.edges, highlighted],
  );

  const details = useMemo<NodeDetails | undefined>(() => {
    const node = prepared.nodes.find((candidate) => candidate.id === selectedId);

    if (node === undefined) {
      return undefined;
    }

    const note = (label: string | undefined): string | undefined => {
      if (label === undefined) {
        return undefined;
      }

      const parts: Array<string> = [];
      const named = /^name:(\S+)/.exec(label);

      if (named?.[1] !== undefined) {
        parts.push(`slot ${named[1]}`);
      }

      if (/\boptional\b/.test(label)) {
        parts.push("optional");
      }

      return parts.length > 0 ? parts.join(" · ") : undefined;
    };
    const labelOf = (id: string): string => prepared.nodes.find((candidate) => candidate.id === id)?.data.label ?? id;

    return {
      label: node.data.label,
      scope: node.data.kind === "unbound" ? "—" : node.data.scope,
      kind: node.data.kind,
      lane: node.data.fromParent ? "root container" : node.data.kind === "unbound" ? "—" : "request child",
      dependsOn: prepared.edges
        .filter((edge) => edge.source === node.id)
        .map((edge) => ({ label: labelOf(edge.target), note: note(edge.label) })),
      usedBy: prepared.edges.filter((edge) => edge.target === node.id).map((edge) => labelOf(edge.source)),
    };
  }, [selectedId, prepared]);

  return (
    // The details panel sits beside the canvas, never over it: an overlay would take the pointer
    // from the nodes underneath and fire leave/enter as the cursor passes.
    <div className="flex h-[32rem] gap-3">
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-background">
        <ReactFlow
          colorMode={colorScheme}
          defaultEdgeOptions={{ type: "default" }}
          edges={flowEdges}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          minZoom={0.3}
          nodes={flowNodes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodeTypes={nodeTypes}
          onNodeClick={(_event, node) => {
            if (node.type === "di") {
              setSelectedId((current) => (current === node.id ? undefined : node.id));
            }
          }}
          onNodeMouseEnter={(_event, node) => {
            if (node.type === "di") {
              hoverNode(node.id);
            }
          }}
          onNodeMouseLeave={(_event, node) => {
            if (node.type === "di") {
              releaseHover();
            }
          }}
          onPaneClick={() => {
            setSelectedId(undefined);
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {details !== undefined ? (
        <aside className="w-60 shrink-0 overflow-auto rounded-md border border-border bg-card p-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-foreground">{details.label}</span>
            <button
              aria-label="Close details"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedId(undefined);
              }}
              type="button"
            >
              ✕
            </button>
          </div>
          <dl className="mt-2 space-y-1 text-muted-foreground">
            <div className="flex justify-between gap-2">
              <dt>kind</dt>
              <dd className="font-mono">{details.kind}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>scope</dt>
              <dd className="font-mono">{details.scope}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>lifetime</dt>
              <dd className="font-mono">{details.lane}</dd>
            </div>
          </dl>
          {details.dependsOn.length > 0 ? (
            <div className="mt-2">
              <p className="font-medium text-foreground">depends on</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {details.dependsOn.map((dependency, index) => (
                  <li key={`${dependency.label}-${String(index)}`}>
                    {dependency.label}
                    {dependency.note !== undefined ? <span className="opacity-70"> · {dependency.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {details.usedBy.length > 0 ? (
            <div className="mt-2">
              <p className="font-medium text-foreground">used by</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {details.usedBy.map((consumer, index) => (
                  <li key={`${consumer}-${String(index)}`}>{consumer}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

/**
 * Interactive DI dependency graph (React Flow). Mount-gated so Nitro SSR never
 * touches browser-only layout APIs.
 */
export function DependencyGraph({ nodes, edges, showShadowed }: DependencyGraphProps): ReactElement {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden className="h-[32rem] rounded-md bg-muted" />;
  }

  return (
    <ReactFlowProvider>
      <DependencyGraphCanvas edges={edges} nodes={nodes} showShadowed={showShadowed} />
    </ReactFlowProvider>
  );
}
