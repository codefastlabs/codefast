"use client";

import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@/lib/utils";
import type { Scope } from "@radix-ui/react-context";

import { scrollAreaScrollbarVariants } from "@/components/scroll-area/scroll-area-scrollbar.variants";
import { cn } from "@/lib/utils";
import { createContextScope } from "@radix-ui/react-context";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

/* -----------------------------------------------------------------------------
 * Context: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = "ScrollArea";

type ScopedProps<P> = P & { __scopeScrollArea?: Scope };

const [createScrollAreaContext] = createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<VariantProps<typeof scrollAreaScrollbarVariants>, "size">;

const [ScrollAreaContextProvider, useScrollAreaContext] =
  createScrollAreaContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

type ScrollAreaProps = ScopedProps<ComponentProps<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue>;

function ScrollArea({ __scopeScrollArea, children, className, size, ...props }: ScrollAreaProps): JSX.Element {
  return (
    <ScrollAreaContextProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root className={cn("relative", className)} data-slot="scroll-area" {...props}>
        <ScrollAreaPrimitive.Viewport
          className="outline-ring ring-ring/50 size-full rounded-[inherit] transition focus-visible:outline-1 focus-visible:ring-4"
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

type ScrollAreaScrollbarProps = ScopedProps<ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>>;

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
      <ScrollAreaPrimitive.ScrollAreaThumb className="bg-border relative flex-1 rounded-full" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ScrollArea, ScrollAreaScrollbar };
export type { ScrollAreaProps, ScrollAreaScrollbarProps };
