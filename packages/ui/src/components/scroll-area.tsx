'use client';

import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { createContextScope } from '@radix-ui/react-context';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { tv } from 'tailwind-variants';

import { cn } from '@/lib/utils';

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
  defaultVariants: {
    size: 'md',
    vertical: 'vertical',
  },
});

/* -----------------------------------------------------------------------------
 * Context: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = 'ScrollArea';

type ScopedProps<P> = P & { __scopeScrollArea?: Scope };

const [createCarouselContext] = createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<VariantProps<typeof scrollAreaScrollbarVariants>, 'size'>;

const [CarouselProvider, useCarouselContext] = createCarouselContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

function ScrollArea({
  __scopeScrollArea,
  children,
  className,
  size,
  ...props
}: ScopedProps<ComponentProps<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue>): JSX.Element {
  return (
    <CarouselProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root
        className={cn('relative overflow-hidden', className)}
        data-slot="scroll-area"
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          className="size-full rounded-[inherit] transition-[color,box-shadow,border-color,background-color] [&>*]:h-full"
          data-slot="scroll-area-viewport"
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaScrollbar orientation="vertical" />
        <ScrollAreaScrollbar orientation="horizontal" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </CarouselProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

function ScrollAreaScrollbar({
  __scopeScrollArea,
  className,
  orientation,
  ...props
}: ScopedProps<ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>>): JSX.Element {
  const { size } = useCarouselContext(SCROLL_AREA_NAME, __scopeScrollArea);

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
