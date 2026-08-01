import type { GraphNode } from "@codefast/di";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";

/** The scopes the legend lists, in the order it lists them — kept beside the branches below. */
export const SCOPE_ORDER = ["singleton", "scoped", "transient"] as const satisfies ReadonlyArray<GraphNode["scope"]>;

interface ScopeDotProps extends ComponentProps<"span"> {
  /** Binding scope this swatch stands for; an unbound placeholder gets the neutral dot. */
  scope: GraphNode["scope"];
}

/**
 * The color channel for binding scope, shared by the graph nodes and the legend so both
 * always agree. Colors live in `styles.css` so light and dark each get their own step.
 */
export function ScopeDot({ scope, className, ...props }: ScopeDotProps): ReactElement {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full bg-muted-foreground",
        scope === "singleton" && "bg-[var(--scope-singleton)]",
        scope === "scoped" && "bg-[var(--scope-scoped)]",
        scope === "transient" && "bg-[var(--scope-transient)]",
        className,
      )}
      {...props}
    />
  );
}
