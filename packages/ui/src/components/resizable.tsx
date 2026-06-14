import type { ComponentProps, JSX } from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "#/lib/utils";

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
      className={cn("flex h-full w-full aria-[orientation=vertical]:flex-col", className)}
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
function ResizableSeparator({ className, withHandle, ...props }: ResizableSeparatorProps): JSX.Element {
  return (
    <ResizablePrimitive.Separator
      className={cn(
        "relative flex w-px items-center justify-center bg-border ring-offset-background after:absolute after:inset-y-0 after:start-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:start-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 rtl:after:translate-x-1/2 rtl:aria-[orientation=horizontal]:after:-translate-x-0 [&[aria-orientation=horizontal]>div]:rotate-90",
        className,
      )}
      data-slot="resizable-separator"
      {...props}
    >
      {withHandle ? <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border" /> : null}
    </ResizablePrimitive.Separator>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ResizableGroup, ResizablePanel, ResizableSeparator };
export type { ResizableGroupProps, ResizablePanelProps, ResizableSeparatorProps };
