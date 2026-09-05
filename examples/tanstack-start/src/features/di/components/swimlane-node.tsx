import type { Node, NodeProps } from "@xyflow/react";
import type { ReactElement } from "react";
import { memo } from "react";

interface LaneNodeData extends Record<string, unknown> {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

export type LaneNode = Node<LaneNodeData, "lane">;

/** The backdrop naming a container lifetime; sized by the layout, never interactive. */
export const SwimlaneNode = memo(function SwimlaneNode({ data }: NodeProps<LaneNode>): ReactElement {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40" style={{ width: data.width, height: data.height }}>
      <span className="absolute top-2 left-3 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {data.label}
      </span>
    </div>
  );
});
