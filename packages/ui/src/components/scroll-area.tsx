import type { ScrollAreaScrollbarVariants } from "#/variants/scroll-area";
import type { Scope } from "@radix-ui/react-context";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

import { scrollAreaScrollbarVariants } from "#/variants/scroll-area";
import { createContextScope } from "@radix-ui/react-context";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

/* -----------------------------------------------------------------------------
 * Context: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = "ScrollArea";

type ScopedProps<P> = P & { __scopeScrollArea?: Scope };

const [createScrollAreaContext] = createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<ScrollAreaScrollbarVariants, "size">;

const [ScrollAreaContextProvider, useScrollAreaContext] =
  createScrollAreaContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ScrollAreaProps = ScopedProps<
  ComponentProps<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue
>;

/**
 * @since 0.3.16-canary.0
 */
function ScrollArea({
  __scopeScrollArea,
  children,
  className,
  size,
  ...props
}: ScrollAreaProps): JSX.Element {
  return (
    <ScrollAreaContextProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root
        className={cn("relative", className)}
        data-slot="scroll-area"
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          className="size-full rounded-[inherit] ring-ring/50 outline-ring transition-[box-shadow] duration-150 ease-snappy focus-visible:ring-4 focus-visible:outline-1 motion-reduce:transition-none motion-reduce:duration-0"
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
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ScrollArea, ScrollAreaScrollbar };
export type { ScrollAreaProps, ScrollAreaScrollbarProps };
