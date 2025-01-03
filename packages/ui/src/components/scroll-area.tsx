'use client';

import type { Scope } from '@radix-ui/react-context';
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { createContextScope } from '@radix-ui/react-context';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { forwardRef } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

const scrollAreaScrollbarVariants = tv({
  base: 'flex touch-none select-none p-px transition',
  compoundVariants: [
    { className: 'w-1.5', orientation: 'vertical', size: 'sm' },
    { className: 'w-2', orientation: 'vertical', size: 'md' },
    { className: 'w-2.5', orientation: 'vertical', size: 'lg' },
    { className: 'h-1.5', orientation: 'horizontal', size: 'sm' },
    { className: 'h-2', orientation: 'horizontal', size: 'md' },
    { className: 'h-2.5', orientation: 'horizontal', size: 'lg' },
  ],
  defaultVariants: {
    size: 'md',
    vertical: 'vertical',
  },
  variants: {
    orientation: {
      horizontal: 'w-full flex-col border-t border-t-transparent',
      vertical: 'h-full flex-row border-l border-l-transparent',
    },
    size: {
      lg: '',
      md: '',
      none: '',
      sm: '',
    },
  },
});

type ScrollAreaScrollbarVariantsProps = VariantProps<typeof scrollAreaScrollbarVariants>;

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = 'ScrollArea';

type ScopedProps<P> = P & { __scopeScrollArea?: Scope };

const [createCarouselContext] = createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<ScrollAreaScrollbarVariantsProps, 'size'>;

const [CarouselProvider, useCarouselContext] = createCarouselContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

type ScrollAreaElement = ComponentRef<typeof ScrollAreaPrimitive.Root>;
type ScrollAreaProps = ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue;

const ScrollArea = forwardRef<ScrollAreaElement, ScrollAreaProps>(
  ({ __scopeScrollArea, children, className, size, ...props }: ScopedProps<ScrollAreaProps>, forwardedRef) => (
    <CarouselProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root ref={forwardedRef} className={cn('relative overflow-hidden', className)} {...props}>
        <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit] [&>*]:h-full">
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaScrollbar orientation="vertical" />
        <ScrollAreaScrollbar orientation="horizontal" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </CarouselProvider>
  ),
);

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

type ScrollAreaScrollbarElement = ComponentRef<typeof ScrollAreaPrimitive.Scrollbar>;
type ScrollAreaScrollbarProps = ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>;

const ScrollAreaScrollbar = forwardRef<ScrollAreaScrollbarElement, ScrollAreaScrollbarProps>(
  ({ __scopeScrollArea, className, orientation, ...props }: ScopedProps<ScrollAreaScrollbarProps>, forwardedRef) => {
    const { size } = useCarouselContext(SCROLL_AREA_NAME, __scopeScrollArea);

    return (
      <ScrollAreaPrimitive.Scrollbar
        ref={forwardedRef}
        className={scrollAreaScrollbarVariants({
          className,
          orientation,
          size,
        })}
        orientation={orientation}
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb className="bg-border relative flex-1 rounded-full" />
      </ScrollAreaPrimitive.Scrollbar>
    );
  },
);

ScrollAreaScrollbar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ScrollAreaProps, ScrollAreaScrollbarProps };
export { ScrollArea, ScrollAreaScrollbar };
