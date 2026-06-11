import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { Context } from "radix-ui/internal";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import type { ScrollAreaScrollbarVariants } from "#/variants/scroll-area";
import { scrollAreaScrollbarVariants } from "#/variants/scroll-area";

/* -----------------------------------------------------------------------------
 * Context: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = "ScrollArea";

type ScopedProps<P> = P & { __scopeScrollArea?: Context.Scope };

const [createScrollAreaContext] = Context.createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<ScrollAreaScrollbarVariants, "size">;

const [ScrollAreaContextProvider, useScrollAreaContext] =
  createScrollAreaContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ScrollAreaProps = ScopedProps<ComponentProps<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue>;

/**
 * @since 0.3.16-canary.0
 */
function ScrollArea({ __scopeScrollArea, children, className, size, ...props }: ScrollAreaProps): JSX.Element {
  return (
    <ScrollAreaContextProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root className={cn("relative", className)} data-slot="scroll-area" {...props}>
        <ScrollAreaPrimitive.Viewport
          className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1"
          data-slot="scroll-area-viewport"
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaScrollbar orientation="vertical" />
        <ScrollAreaScrollbar orientation="horizontal" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </ScrollAreaContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ScrollAreaScrollbarProps = ScopedProps<ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>>;

/**
 * @since 0.3.16-canary.0
 */
function ScrollAreaScrollbar({
  __scopeScrollArea,
  className,
  orientation,
  ...props
}: ScrollAreaScrollbarProps): JSX.Element {
  const { size } = useScrollAreaContext(SCROLL_AREA_NAME, __scopeScrollArea);

  return (
    <ScrollAreaPrimitive.Scrollbar
      className={scrollAreaScrollbarVariants({ className, orientation, size })}
      data-orientation={orientation}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className="relative flex-1 rounded-full bg-border"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ScrollArea, ScrollAreaScrollbar };
export type { ScrollAreaProps, ScrollAreaScrollbarProps };
