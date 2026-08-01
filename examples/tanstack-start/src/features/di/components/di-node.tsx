import type { GraphNode } from "@codefast/di";
import { cn } from "@codefast/ui/lib/utils";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import type { ReactElement } from "react";
import { memo } from "react";

import { ScopeDot } from "#/features/di/components/scope-dot";

export interface DiNodeData extends Record<string, unknown> {
  readonly label: string;
  /** Named multi-binding slot (e.g. `non-empty`) when this node is one of several on a token. */
  readonly slotName: string | undefined;
  readonly scope: GraphNode["scope"];
  readonly kind: GraphNode["kind"];
  readonly fromParent: boolean;
  readonly unbound: boolean;
  readonly shadowsRoot: boolean;
  /** Something depends on this binding, so an edge arrives at the top. */
  readonly hasDependents: boolean;
  /** This binding depends on something, so an edge leaves from the bottom. */
  readonly hasDependencies: boolean;
  readonly dimmed: boolean;
  readonly selected: boolean;
}

export type DiNode = Node<DiNodeData, "di">;

/** One binding on the graph canvas: token, slot, and the scope swatch that colors its lifetime. */
export const DiServiceNode = memo(function DiServiceNode({ data }: NodeProps<DiNode>): ReactElement {
  return (
    <div
      className={cn(
        "w-44 rounded-md border border-border px-3 py-2 text-center transition-opacity",
        data.unbound ? "border-dashed bg-card/50 opacity-70" : "bg-card shadow-sm",
        data.fromParent && !data.unbound && "border-dashed",
        data.selected && "border-ring ring-2 ring-ring/40",
        data.dimmed && "opacity-20",
      )}
      title={data.unbound ? "optional dependency with no binding" : `${data.kind} binding`}
    >
      {/* A handle only exists where an edge actually lands; otherwise it reads as a dangling dot. */}
      {data.hasDependents ? <Handle className="!bg-muted-foreground" position={Position.Top} type="target" /> : null}
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground">
        <span>{data.label}</span>
        {data.shadowsRoot ? (
          <span className="rounded-sm bg-muted px-1 py-px text-[9px] font-normal text-muted-foreground">
            overrides root
          </span>
        ) : null}
      </div>
      {data.slotName !== undefined ? (
        <div className="mt-0.5 font-mono text-[10px] text-foreground">{data.slotName}</div>
      ) : null}
      <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        {data.unbound ? null : <ScopeDot scope={data.scope} />}
        <span>{data.unbound ? "optional · not bound" : data.scope}</span>
      </div>
      {data.hasDependencies ? (
        <Handle className="!bg-muted-foreground" position={Position.Bottom} type="source" />
      ) : null}
    </div>
  );
});
