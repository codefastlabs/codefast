import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";

interface GraphSourceProps extends Omit<ComponentProps<"pre">, "children"> {
  source: string;
}

/** Scrollable source block for the text form of a graph adapter's output. */
export function GraphSource({ source, className, ...props }: GraphSourceProps): ReactElement {
  return (
    <pre
      className={cn(
        "h-64 overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      {source}
    </pre>
  );
}
