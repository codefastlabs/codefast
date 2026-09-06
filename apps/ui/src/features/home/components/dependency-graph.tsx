import type { ContainerGraphJson, GraphNode } from "@codefast/di";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { NODE_HEIGHT, NODE_WIDTH, edgePath, layoutGraph } from "#/features/home/demos/wiring-order";

interface DependencyGraphProps extends Omit<ComponentProps<"svg">, "children" | "viewBox"> {
  readonly graph: ContainerGraphJson;
  /** The nodes the container has constructed in the current round. */
  readonly constructed: ReadonlySet<string>;
  /** The node being constructed right now, while a resolution animates. */
  readonly active?: string | undefined;
}

// The scope decides what a request scope renews, so it gets the colour: singletons in the brand, scoped in amber.
function scopeClassName(scope: GraphNode["scope"]): string {
  switch (scope) {
    case "singleton": {
      return "fill-ui-brand";
    }
    case "scoped": {
      return "fill-amber-600 dark:fill-amber-400";
    }
    default: {
      return "fill-ui-muted";
    }
  }
}

/** A container's dependency graph as SVG: dependents on the left, an arrow to every dependency. */
export function DependencyGraph({ graph, constructed, active, className, ...props }: DependencyGraphProps) {
  const layout = layoutGraph(graph);

  return (
    <svg
      viewBox={`-2 -2 ${layout.width + 4} ${layout.height + 4}`}
      role="img"
      aria-label="Dependency graph of the demo container"
      className={cn("h-auto w-full", className)}
      {...props}
    >
      <defs>
        <marker id="wiring-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8Z" className="fill-ui-muted" />
        </marker>
      </defs>
      {layout.edges.map((edge) => (
        <path
          key={`${edge.from}-${edge.to}`}
          d={edgePath(edge)}
          className={cn(
            "fill-none stroke-ui-border transition-colors duration-300",
            constructed.has(edge.from) && constructed.has(edge.to) && "stroke-ui-brand",
          )}
          strokeWidth={1.5}
          markerEnd="url(#wiring-arrow)"
        />
      ))}
      {layout.nodes.map(({ node, x, y }) => (
        <g key={node.id} transform={`translate(${x} ${y})`}>
          <rect
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={10}
            className={cn(
              "fill-ui-card stroke-ui-border transition-colors duration-300",
              constructed.has(node.id) && "stroke-ui-brand",
              active === node.id && "fill-ui-brand/10",
            )}
            strokeWidth={1.5}
          />
          <text x={14} y={22} className="fill-ui-fg text-[13px] font-semibold">
            {node.tokenName}
          </text>
          <text x={14} y={40} className={cn("font-mono text-[10px]", scopeClassName(node.scope))}>
            {node.kind} · {node.scope}
          </text>
        </g>
      ))}
    </svg>
  );
}
