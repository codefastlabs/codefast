import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { useAppearance } from "@codefast/theme";
import { Background, Controls, MarkerType, Position, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DiNode } from "#/features/di/components/di-node";
import { DiServiceNode } from "#/features/di/components/di-node";
import { NodeDetailsPanel } from "#/features/di/components/node-details-panel";
import type { LaneNode } from "#/features/di/components/swimlane-node";
import { SwimlaneNode } from "#/features/di/components/swimlane-node";
import { layoutLanes, prepareGraph, slotNamesByNode } from "#/features/di/lib/graph-layout";
import { describeNode } from "#/features/di/lib/node-details";

import "@xyflow/react/dist/style.css";

interface DependencyGraphProps extends ReactFlowGraph {
  /** Include root bindings that a child binding shadows (hidden by default as visual noise). */
  showShadowed: boolean;
}

const HOVER_RELEASE_MS = 140;
const nodeTypes = { di: DiServiceNode, lane: SwimlaneNode };

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
  const slotNames = useMemo(() => slotNamesByNode(prepared.edges), [prepared.edges]);
  const { positions, lanes } = useMemo(
    () => layoutLanes(prepared.nodes, prepared.edges, slotNames),
    [prepared.nodes, prepared.edges, slotNames],
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

  // Everything a node shows that hover and selection cannot change, built once per graph.
  const baseNodes: Array<DiNode> = useMemo(
    () =>
      prepared.nodes.map((node) => ({
        id: node.id,
        type: "di",
        position: positions.get(node.id) ?? node.position,
        data: {
          label: node.data.label,
          slotName: slotNames.get(node.id),
          scope: node.data.scope,
          kind: node.data.kind,
          fromParent: node.data.fromParent,
          unbound: node.data.kind === "unbound",
          shadowsRoot: prepared.shadowingIds.has(node.id),
          dimmed: false,
          selected: false,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })),
    [prepared, positions, slotNames],
  );

  // React Flow re-renders a node when its `data` identity changes, so nodes whose dimmed/selected
  // flags did not move keep the exact object they already had. A new base invalidates the cache.
  const nodeCacheRef = useRef<{ base: Array<DiNode>; byId: Map<string, DiNode> }>({ base: [], byId: new Map() });

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
        const onPath = highlighted === undefined || (highlighted.has(edge.source) && highlighted.has(edge.target));

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "default",
          animated: false,
          style: {
            ...(edge.optional ? { strokeDasharray: "6 4" } : {}),
            opacity: onPath ? 1 : 0.12,
            strokeWidth: highlighted !== undefined && onPath ? 2 : 1.5,
            transition: "opacity 140ms ease, stroke-width 140ms ease",
          },
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        };
      }),
    [prepared.edges, highlighted],
  );

  const details = useMemo(() => describeNode(prepared, selectedId), [prepared, selectedId]);

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
      {details === undefined ? null : (
        <NodeDetailsPanel
          details={details}
          onClose={() => {
            setSelectedId(undefined);
          }}
        />
      )}
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
