"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

/* -----------------------------------------------------------------------------
 * Component: ResizableGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ResizableGroupProps = ComponentProps<typeof ResizablePrimitive.Group>;

/**
 * @since 0.3.16-canary.0
 */
function ResizableGroup({ className, ...props }: ResizableGroupProps): JSX.Element {
  return (
    <ResizablePrimitive.Group
      className={cn("flex size-full", className)}
      data-slot="resizable-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ResizablePanel
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ResizablePanelProps = ComponentProps<typeof ResizablePrimitive.Panel>;

/**
 * @since 0.3.16-canary.0
 */
function ResizablePanel({ ...props }: ResizablePanelProps): JSX.Element {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ResizableSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface ResizableSeparatorProps extends ComponentProps<typeof ResizablePrimitive.Separator> {
  withHandle?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function ResizableSeparator({
  className,
  withHandle,
  ...props
}: ResizableSeparatorProps): JSX.Element {
  return (
    <ResizablePrimitive.Separator
      className={cn(
        "flex items-center justify-center",
        "bg-border outline-hidden",
        "focus-visible:bg-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "aria-[orientation=horizontal]:h-px",
        "aria-[orientation=vertical]:w-px",
        className,
      )}
      data-slot="resizable-separator"
      {...props}
    >
      {withHandle ? (
        <div
          className={cn(
            "z-10 flex h-4 w-3 items-center justify-center",
            "rounded-sm border",
            "bg-border",
          )}
        >
          <GripVerticalIcon className="size-2.5" />
        </div>
      ) : null}
    </ResizablePrimitive.Separator>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ResizableGroup, ResizablePanel, ResizableSeparator };
export type { ResizableGroupProps, ResizablePanelProps, ResizableSeparatorProps };
