import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Kbd
 * -------------------------------------------------------------------------- */

type KbdProps = ComponentProps<"kbd">;

function Kbd({ className, ...props }: KbdProps): JSX.Element {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 px-1",
        "rounded-md",
        "bg-muted font-sans text-xs font-medium text-muted-foreground",
        "pointer-events-none select-none",
        "in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background",
        "dark:in-data-[slot=tooltip-content]:bg-background/10",
        "[&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  );
}

type KbdGroupProps = ComponentProps<"kbd">;

function KbdGroup({ className, ...props }: KbdGroupProps): JSX.Element {
  return (
    <kbd
      className={cn("inline-flex items-center gap-1", className)}
      data-slot="kbd-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Kbd, KbdGroup };
export type { KbdGroupProps, KbdProps };
