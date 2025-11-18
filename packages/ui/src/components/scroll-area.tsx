'use client';

import type { ComponentProps, JSX } from 'react';

import type { VariantProps } from '@codefast/tailwind-variants';
import type { Scope } from '@radix-ui/react-context';

import { cn, tv } from '@codefast/tailwind-variants';
import { createContextScope } from '@radix-ui/react-context';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

/* -----------------------------------------------------------------------------
 * Variant: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

const scrollAreaScrollbarVariants = tv({
  base: 'flex touch-none select-none p-px transition-colors',
  compoundVariants: [
    {
      className: 'w-1.5',
      orientation: 'vertical',
      size: 'sm',
    },
    {
      className: 'w-2',
      orientation: 'vertical',
      size: 'md',
    },
    {
      className: 'w-2.5',
      orientation: 'vertical',
      size: 'lg',
    },
    {
      className: 'h-1.5',
      orientation: 'horizontal',
      size: 'sm',
    },
    {
      className: 'h-2',
      orientation: 'horizontal',
      size: 'md',
    },
    {
      className: 'h-2.5',
      orientation: 'horizontal',
      size: 'lg',
    },
  ],
  defaultVariants: {
    orientation: 'vertical',
    size: 'md',
  },
  variants: {
    orientation: {
      horizontal: 'w-full flex-col border-t border-t-transparent',
      vertical: 'h-full flex-row border-l border-l-transparent',
    },
    size: {
      none: '',

      sm: '',

      md: '',

      lg: '',
    },
  },
});

/* -----------------------------------------------------------------------------
 * Context: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = 'ScrollArea';

type ScopedProps<P> = P & { __scopeScrollArea?: Scope };

const [createScrollAreaContext] = createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<VariantProps<typeof scrollAreaScrollbarVariants>, 'size'>;

const [ScrollAreaContextProvider, useScrollAreaContext] =
  createScrollAreaContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

type ScrollAreaProps = ScopedProps<ComponentProps<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue>;

function ScrollArea({ __scopeScrollArea, children, className, size, ...props }: ScrollAreaProps): JSX.Element {
  return (
    <ScrollAreaContextProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root className={cn('relative', className)} data-slot="scroll-area" {...props}>
        <ScrollAreaPrimitive.Viewport
          className="outline-ring ring-ring/50 size-full rounded-[inherit] transition focus-visible:ring-4 focus-visible:outline-1"
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

export { scrollAreaScrollbarVariants };
export { ScrollArea, ScrollAreaScrollbar };
export type { ScrollAreaProps, ScrollAreaScrollbarProps };
