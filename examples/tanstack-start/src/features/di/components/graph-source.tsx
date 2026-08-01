import type { ReactElement } from "react";

interface GraphSourceProps {
  source: string;
}

/** Scrollable source block for the text form of a graph adapter's output. */
export function GraphSource({ source }: GraphSourceProps): ReactElement {
  return (
    <pre className="h-64 overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs text-muted-foreground">
      {source}
    </pre>
  );
}
